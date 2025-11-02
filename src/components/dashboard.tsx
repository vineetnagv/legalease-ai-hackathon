
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  LoaderCircle,
  LogOut,
  UploadCloud,
  Settings,
  Download,
  Copy,
  Share2,
} from 'lucide-react';
import { suggestRole, extractDocumentKeyNumbers, assessDocumentRiskLevel, explainDocumentClauses, generateDocumentFAQs, detectDocumentTypeFromText, sendChatMessage, generateSuggestedQuestions, detectMissingClausesInDocument } from '@/app/actions';
import { DocumentReportExporter } from '@/lib/export-utils';
import type { ExtractKeyNumbersOutput, KeyNumber } from '@/ai/flows/extract-key-numbers';
import type { AssessDocumentRiskOutput } from '@/ai/flows/assess-document-risk';
import type { ExplainClausesOutput, ClauseExplanation } from '@/ai/flows/explain-clauses';
import type { GenerateFaqOutput, FAQItem } from '@/ai/flows/generate-faq';
import type { DetectMissingClausesOutput } from '@/ai/flows/detect-missing-clauses';
import type { DetectDocumentTypeOutput, DocumentType } from '@/types/document-types';
import type { DocumentContext, ChatMessage } from '@/types/chat-types';
import { ChatInterface } from './chat-interface';
import Link from 'next/link';
import { VerticalDock, VerticalDockItem, VerticalDockIcon, VerticalDockLabel } from '@/components/ui/vertical-dock';
import { ChatHistoryPanel } from '@/components/panels/chat-history-panel';
import { SettingsPanel } from '@/components/panels/settings-panel';
import { DocumentComparisonPanel } from '@/components/panels/document-comparison-panel';
import { UserPreferencesService } from '@/lib/user-preferences';
import {
  MessageSquare,
  History,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  FileQuestion
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { ThemeToggle } from './theme-toggle';
import { useLanguage } from '@/contexts/language-context';
import { LanguageSelector } from './language-selector';
import { useTranslation } from '@/lib/translations';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import ErrorBoundary from '@/components/error-boundary';
import { EnhancedLoading, FileUploadLoading } from '@/components/ui/enhanced-loading';
import { GeneralChatbot } from '@/components/general-chatbot';

type Status =
  | 'idle'
  | 'processing_document'
  | 'detecting_type'
  | 'suggesting_role'
  | 'ready'
  | 'extracting_numbers'
  | 'numbers_complete'
  | 'assessing_risk'
  | 'risk_complete'
  | 'explaining_clauses'
  | 'clauses_complete'
  | 'generating_faqs'
  | 'faqs_complete'
  | 'detecting_missing'
  | 'missing_complete'
  | 'chat_ready'
  | 'error';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = useTranslation(language);

  const [status, setStatus] = useState<Status>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Dock panel states
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState(UserPreferencesService.loadPreferences());

  // Listen for preference changes
  useEffect(() => {
    const handlePreferencesChange = (event: CustomEvent) => {
      setUserPreferences(event.detail);
    };

    window.addEventListener('preferencesChanged', handlePreferencesChange as EventListener);

    return () => {
      window.removeEventListener('preferencesChanged', handlePreferencesChange as EventListener);
    };
  }, []);
  
  const [suggestedRole, setSuggestedRole] = useState('');
  const [selectedRoleOption, setSelectedRoleOption] = useState('');
  const [customRole, setCustomRole] = useState('');

  // Analysis results
  const [documentText, setDocumentText] = useState('');
  const [keyNumbers, setKeyNumbers] = useState<KeyNumber[]>([]);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskSummary, setRiskSummary] = useState('');
  const [clauses, setClauses] = useState<ClauseExplanation[]>([]);
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set());
  const [missingClauses, setMissingClauses] = useState<DetectMissingClausesOutput | null>(null);
  const [expandedMissingClauses, setExpandedMissingClauses] = useState<Set<number>>(new Set());

  // Document type detection state
  const [documentType, setDocumentType] = useState<DocumentType>('Unclassified Document');
  const [documentTypeConfidence, setDocumentTypeConfidence] = useState<number>(0);

  const userRole = useMemo(() => {
    return selectedRoleOption === 'other' ? customRole : selectedRoleOption;
  }, [selectedRoleOption, customRole]);

  const canAnalyze = useMemo(() => file && userRole, [file, userRole]);

  // Build document context for chat
  const documentContext = useMemo((): DocumentContext | null => {
    if (!documentText || !userRole || status !== 'chat_ready') {
      return null;
    }

    return {
      documentType,
      documentTypeConfidence,
      userRole,
      documentText,
      keyNumbers: keyNumbers.map(kn => ({
        label: kn.label,
        value: kn.value
      })),
      riskScore,
      riskSummary,
      clauses: clauses.map(c => ({
        clauseTitle: c.clauseTitle,
        originalText: c.originalText,
        plainEnglish: c.plainEnglish,
        jargon: c.jargon.map(j => ({
          term: j.term,
          definition: j.definition
        }))
      })),
      faqs: faqs.map(f => ({
        question: f.question,
        answer: f.answer
      }))
    };
  }, [documentText, userRole, status, documentType, documentTypeConfidence, keyNumbers, riskScore, riskSummary, clauses, faqs]);

  // Helper function for API-based document parsing
  const parseDocumentViaAPI = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/parse-document', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    return await response.json();
  };

  const handleFileChange = useCallback(
    async (selectedFile: File | null) => {
      if (selectedFile) {
        // Reset previous state
        setFile(selectedFile);
        setSuggestedRole('');
        setSelectedRoleOption('');
        setCustomRole('');
        setDocumentText('');

        try {
          // Show processing status
          setStatus('processing_document');

          // Use API to extract text from various file formats
          const parseResult = await parseDocumentViaAPI(selectedFile);

          // Validate extracted text
          if (!parseResult.text || parseResult.text.trim() === '') {
            toast({
              variant: 'destructive',
              title: 'Document Processing Failed',
              description: 'No readable text could be extracted from this document.',
            });
            setStatus('idle');
            setFile(null);
            return;
          }

          // Store the extracted text
          setDocumentText(parseResult.text);

          // Show extraction method in a toast for transparency
          const extractionMethod = parseResult.metadata.extractionMethod;
          if (extractionMethod.includes('ocr')) {
            toast({
              title: 'Document Processed',
              description: `Text extracted using OCR (${extractionMethod}). Processing may take a moment.`,
            });
          }

          // Move to document type detection
          setStatus('detecting_type');

          const typeResult = await detectDocumentTypeFromText(parseResult.text);
          setDocumentType(typeResult.documentType);
          setDocumentTypeConfidence(typeResult.confidence);

          // Move to role suggestion
          setStatus('suggesting_role');

          const role = await suggestRole(parseResult.text);
          setSuggestedRole(role);
          setSelectedRoleOption(role);
          setStatus('ready');

        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          let errorTitle = 'Document Processing Failed';
          let errorDescription = err.message;

          // Handle specific error types with more detailed messaging
          if (err.message.includes('File size')) {
            errorTitle = 'File Too Large';
            errorDescription = 'The uploaded file exceeds the maximum size limit. Please try a smaller file or compress your document.';
          } else if (err.message.includes('Unsupported file type')) {
            errorTitle = 'Unsupported File Type';
            errorDescription = 'Please upload a .txt, .pdf, or .docx file. Other formats are not currently supported.';
          } else if (err.message.includes('timeout')) {
            errorTitle = 'Processing Timeout';
            errorDescription = 'Document processing took too long. This may be due to file complexity or size. Please try a simpler document or try again later.';
          } else if (err.message.includes('OCR')) {
            errorTitle = 'Text Recognition Failed';
            errorDescription = 'Unable to extract readable text from this document. The file may be corrupted, password-protected, or contain only images without clear text.';
          } else if (err.message.includes('image-based PDF')) {
            errorTitle = 'Image-Based PDF Detected';
            errorDescription = 'This PDF appears to contain scanned images rather than selectable text. Text extraction is not available for this type of document.';
          } else if (err.message.includes('Document text is required')) {
            errorTitle = 'Empty Document';
            errorDescription = 'The document appears to be empty or contains no readable text.';
          } else if (err.message.includes('model not found')) {
            errorTitle = 'Service Configuration Error';
            errorDescription = 'AI analysis service is temporarily unavailable. Please try again later.';
          } else if (err.message.includes('API key')) {
            errorTitle = 'Service Authentication Error';
            errorDescription = 'Unable to connect to analysis services. Please try again later.';
          } else if (err.message.includes('network') || err.message.includes('fetch')) {
            errorTitle = 'Connection Error';
            errorDescription = 'Unable to process the document due to a network issue. Please check your connection and try again.';
          }

          console.error('Document processing error:', err);

          toast({
            variant: 'destructive',
            title: errorTitle,
            description: errorDescription,
          });

          setStatus('error');
          // Don't clear the file immediately to allow retry
          setTimeout(() => {
            setStatus('idle');
            setFile(null);
          }, 5000);
        }
      }
    },
    [toast, t]
  );

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };


  const handleReset = () => {
    setStatus('idle');
    setFile(null);
    setSuggestedRole('');
    setSelectedRoleOption('');
    setCustomRole('');
    setDocumentText('');
    setKeyNumbers([]);
    setRiskScore(null);
    setRiskSummary('');
    setClauses([]);
    setExpandedClauses(new Set());
    setFaqs([]);
    setExpandedFaqs(new Set());
    setDocumentType('Unclassified Document');
    setDocumentTypeConfidence(0);
  };

  const toggleClause = (index: number) => {
    setExpandedClauses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleMissingClause = (index: number) => {
    setExpandedMissingClauses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleAnalyze = useCallback(async () => {
    if (!documentText || !userRole) {
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: 'Document text and user role are required for analysis.',
      });
      return;
    }

    // Reset previous results
    setKeyNumbers([]);
    setRiskScore(null);
    setRiskSummary('');
    setClauses([]);
    setFaqs([]);

    try {
      // Step 1: Extract Key Numbers (with document type context)
      setStatus('extracting_numbers');
      const keyNumbersResult = await extractDocumentKeyNumbers(documentText, documentType);
      setKeyNumbers(keyNumbersResult.keyNumbers);
      setStatus('numbers_complete');

      // Small delay to show the waterfall effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Assess Document Risk (with document type context)
      setStatus('assessing_risk');
      const riskResult = await assessDocumentRiskLevel(documentText, userRole, documentType);
      setRiskScore(riskResult.riskScore);
      setRiskSummary(riskResult.riskSummary);
      setStatus('risk_complete');

      // Small delay to show the waterfall effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Explain Legal Clauses
      setStatus('explaining_clauses');
      const clausesResult = await explainDocumentClauses(documentText, userRole);
      setClauses(clausesResult.clauses);
      setStatus('clauses_complete');

      // Small delay to show the waterfall effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Generate FAQs
      setStatus('generating_faqs');
      const faqsResult = await generateDocumentFAQs(documentText, userRole);
      setFaqs(faqsResult.faqs);
      setStatus('faqs_complete');

      // Small delay to show the waterfall effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 5: Detect Missing Clauses
      setStatus('detecting_missing');
      const missingClausesResult = await detectMissingClausesInDocument(documentText, userRole, documentType);
      setMissingClauses(missingClausesResult);
      setStatus('missing_complete');

      // Small delay to show the waterfall effect
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 6: Initialize Chat
      setStatus('chat_ready');

      toast({
        title: 'Analysis Complete',
        description: `Found ${keyNumbersResult.keyNumbers.length} key numbers, risk level ${riskResult.riskScore}/100, explained ${clausesResult.clauses.length} clauses, generated ${faqsResult.faqs.length} FAQs, identified ${missingClausesResult.missingClauses.length} missing clauses, and chat is ready.`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      setStatus('ready');
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'An error occurred during analysis. Please try again.',
      });
    }
  }, [documentText, userRole, toast]);

  // Handle chat messages
  const handleChatMessage = useCallback(async (message: string) => {
    if (!documentContext) {
      throw new Error('Document context not available for chat');
    }

    try {
      const response = await sendChatMessage(message, [], documentContext);
      return {
        response: response.response,
        suggestedFollowUps: response.suggestedFollowUps || []
      };
    } catch (error) {
      console.error('Chat message error:', error);
      throw error;
    }
  }, [documentContext]);

  // Export handlers
  const handleExportPDF = useCallback(async () => {
    if (!documentContext || !missingClauses) return;

    try {
      await DocumentReportExporter.exportToPDF({
        documentContext,
        missingClauses,
        fileName: `${documentContext.documentType}_Analysis_${new Date().toISOString().split('T')[0]}.pdf`
      });

      toast({
        title: 'PDF Generated',
        description: 'Your analysis report has been downloaded as a PDF.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Unable to generate PDF report. Please try again.',
      });
    }
  }, [documentContext, missingClauses, toast]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!documentContext || !missingClauses) return;

    try {
      const success = await DocumentReportExporter.copyToClipboard({
        documentContext,
        missingClauses
      });

      if (success) {
        toast({
          title: 'Copied to Clipboard',
          description: 'Analysis summary has been copied to your clipboard.',
        });
      } else {
        throw new Error('Copy failed');
      }
    } catch (error) {
      console.error('Clipboard copy error:', error);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Unable to copy to clipboard. Please try selecting and copying manually.',
      });
    }
  }, [documentContext, missingClauses, toast]);

  const isProcessing = status === 'processing_document' || status === 'detecting_type' || status === 'suggesting_role';
  const isAnalyzing = status === 'extracting_numbers' || status === 'assessing_risk' || status === 'explaining_clauses' || status === 'generating_faqs';

  // Handle dock actions - Stabilized with useCallback to prevent animation disruption
  const handleChatHistoryClick = useCallback(() => {
    setIsChatHistoryOpen(true);
    setIsSettingsOpen(false);
    setIsComparisonOpen(false);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setIsSettingsOpen(true);
    setIsChatHistoryOpen(false);
    setIsComparisonOpen(false);
  }, []);

  const handleComparisonClick = useCallback(() => {
    if (!documentContext) {
      toast({
        variant: 'destructive',
        title: 'Comparison Not Available',
        description: 'Please complete document analysis first to enable comparison features.',
      });
      return;
    }

    setIsComparisonOpen(true);
    setIsChatHistoryOpen(false);
    setIsSettingsOpen(false);
  }, [documentContext, toast]);

  const handleExportClick = useCallback(() => {
    if (documentContext && missingClauses) {
      handleExportPDF();
    } else {
      toast({
        variant: 'destructive',
        title: 'Export Not Available',
        description: 'Complete document analysis first to export results.',
      });
    }
  }, [documentContext, missingClauses, handleExportPDF, toast]);

  // Check if dock should be shown based on user preferences
  const showDock = userPreferences.ui.dockPosition !== 'hidden';
  const dockPosition = userPreferences.ui.dockPosition;

  // Memoized dock component to prevent re-renders from affecting animations
  const dockComponent = useMemo(() => {
    if (!showDock) return null;

    return (
      <div className={`hidden md:block fixed top-1/2 -translate-y-1/2 z-40 ${
        dockPosition === 'left' ? 'left-4' : 'right-4'
      }`}>
        <VerticalDock key="main-dock">
          <VerticalDockItem onClick={handleChatHistoryClick}>
            <VerticalDockIcon>
              <History className="h-6 w-6" />
            </VerticalDockIcon>
            <VerticalDockLabel>Chat History</VerticalDockLabel>
          </VerticalDockItem>

          <VerticalDockItem onClick={handleExportClick}>
            <VerticalDockIcon>
              <DownloadIcon className="h-6 w-6" />
            </VerticalDockIcon>
            <VerticalDockLabel>Export</VerticalDockLabel>
          </VerticalDockItem>

          <VerticalDockItem onClick={handleSettingsClick}>
            <VerticalDockIcon>
              <SettingsIcon className="h-6 w-6" />
            </VerticalDockIcon>
            <VerticalDockLabel>Settings</VerticalDockLabel>
          </VerticalDockItem>

          <VerticalDockItem onClick={handleComparisonClick}>
            <VerticalDockIcon>
              <FileQuestion className="h-6 w-6" />
            </VerticalDockIcon>
            <VerticalDockLabel>Compare</VerticalDockLabel>
          </VerticalDockItem>
        </VerticalDock>
      </div>
    );
  }, [
    showDock,
    dockPosition,
    handleChatHistoryClick,
    handleExportClick,
    handleSettingsClick,
    handleComparisonClick
  ]);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Dashboard error boundary caught:', error, errorInfo);
        toast({
          variant: 'destructive',
          title: 'Application Error',
          description: 'An unexpected error occurred. The page will refresh automatically.',
        });
      }}
    >
      <div className="flex min-h-screen w-full flex-col relative">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">LegalEase</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.photoURL ?? ''}
                    alt={user?.displayName ?? 'User'}
                  />
                  <AvatarFallback>
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{user?.displayName}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('settings')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {t('legal_document_analysis')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('upload_and_get_insights')}
              </p>
            </div>
          
            <Card>
              <CardContent className="space-y-6 p-6">
                <div
                  className={`relative flex min-h-[200px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    isDragging ? 'border-primary bg-accent' : ''
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragEvents}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById('file-upload')?.click()
                  }
                >
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleFileChange(e.target.files?.[0] ?? null)
                    }
                    accept=".txt,.pdf,.docx"
                    disabled={isProcessing}
                  />
                  {status === 'processing_document' ? (
                    <EnhancedLoading
                      title="Processing Document"
                      message="Extracting text from your file..."
                      showProgress={false}
                      variant="default"
                    />
                  ) : status === 'detecting_type' ? (
                    <EnhancedLoading
                      title="Detecting Document Type"
                      message="Analyzing document structure and content..."
                      showProgress={false}
                      variant="default"
                    />
                  ) : status === 'suggesting_role' ? (
                    <EnhancedLoading
                      title={t('suggesting_role')}
                      message="Analyzing document content to suggest your role..."
                      showProgress={false}
                      variant="default"
                    />
                  ) : file ? (
                    <div className="text-center text-primary">
                      <FileText className="mx-auto h-12 w-12" />
                      <p className="mt-2 font-semibold">{file.name}</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                      >
                        {t('remove_file')}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <UploadCloud className="mx-auto h-12 w-12" />
                      <p className="mt-4 font-semibold">
                        {t('drag_and_drop')}
                      </p>
                      <p className="text-sm">{t('or_click_browse')}</p>
                      <p className="mt-2 text-xs">Supports .txt, .pdf, .docx files</p>
                    </div>
                  )}
                </div>

                {file && !isProcessing && (
                  <div className="space-y-4">
                    {/* Document Type Display */}
                    {documentType && documentType !== 'Unclassified Document' && documentTypeConfidence > 50 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            Document Type Detected:
                          </span>
                          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                            {documentType}
                          </span>
                        </div>
                        {documentTypeConfidence > 0 && (
                          <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                            Confidence: {documentTypeConfidence}%
                          </div>
                        )}
                      </div>
                    )}

                    <label className="text-sm font-medium">
                      {t('confirm_your_role')}
                    </label>
                    <RadioGroup
                      value={selectedRoleOption}
                      onValueChange={setSelectedRoleOption}
                      disabled={isProcessing}
                    >
                      {suggestedRole && suggestedRole !== 'Other' && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={suggestedRole}
                            id={`role-${suggestedRole}`}
                          />
                          <Label htmlFor={`role-${suggestedRole}`}>
                            {suggestedRole} {t('ai_suggestion')}
                          </Label>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="role-other" />
                        <Label htmlFor="role-other">{t('other')}</Label>
                      </div>
                    </RadioGroup>
                    {selectedRoleOption === 'other' && (
                      <Input
                        placeholder={t('specify_your_role')}
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        disabled={isProcessing}
                      />
                    )}
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze || isProcessing || isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      {t('analyzing')}
                    </>
                  ) : (
                    t('analyze_document')
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Progress Indicator */}
            {(isAnalyzing || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && (
              <ProgressIndicator
                currentStep={status}
                showDetailedView={true}
                className="w-full"
              />
            )}

            {/* Step 1: Key Numbers Analysis */}
            {(status === 'extracting_numbers' || status === 'numbers_complete' || status === 'assessing_risk' || status === 'risk_complete' || status === 'explaining_clauses' || status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold">Key Numbers & Dates</h2>
                    {status === 'extracting_numbers' && (
                      <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {(status === 'numbers_complete' || status === 'assessing_risk' || status === 'risk_complete' || status === 'explaining_clauses' || status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>

                  {status === 'extracting_numbers' && (
                    <p className="text-muted-foreground">Extracting key numbers and dates...</p>
                  )}

                  {keyNumbers.length > 0 && (
                    <div className="grid gap-3">
                      {keyNumbers.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-accent/50 rounded-lg"
                        >
                          <span className="font-medium text-sm">{item.label}</span>
                          <span className="text-sm text-muted-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(status === 'numbers_complete' || status === 'assessing_risk' || status === 'risk_complete' || status === 'explaining_clauses' || status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && keyNumbers.length === 0 && (
                    <p className="text-muted-foreground">No key numbers or dates found in this document.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Risk Assessment */}
            {(status === 'assessing_risk' || status === 'risk_complete' || status === 'explaining_clauses' || status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold">Risk Assessment</h2>
                    {status === 'assessing_risk' && (
                      <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {(status === 'risk_complete' || status === 'explaining_clauses' || status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>

                  {status === 'assessing_risk' && (
                    <p className="text-muted-foreground">Analyzing document for potential risks...</p>
                  )}

                  {(status === 'risk_complete' || status === 'explaining_clauses' || status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && riskScore !== null && (
                    <div className="space-y-4">
                      {/* Risk Score Display */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Risk Score</span>
                          <span className={`font-bold text-lg ${
                            riskScore <= 30 ? 'text-green-600' :
                            riskScore <= 70 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {riskScore}/100
                          </span>
                        </div>

                        {/* Risk Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              riskScore <= 30 ? 'bg-green-500' :
                              riskScore <= 70 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${riskScore}%` }}
                          />
                        </div>

                        {/* Risk Level Label */}
                        <p className={`text-sm font-medium ${
                          riskScore <= 30 ? 'text-green-600' :
                          riskScore <= 70 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {riskScore <= 30 ? 'Low Risk' :
                           riskScore <= 70 ? 'Medium Risk' :
                           'High Risk'}
                        </p>
                      </div>

                      {/* Risk Summary */}
                      {riskSummary && (
                        <div className="p-4 bg-accent/30 rounded-lg">
                          <h4 className="font-medium mb-2">Risk Summary</h4>
                          <p className="text-sm text-muted-foreground">{riskSummary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Clause Explanations */}
            {(status === 'explaining_clauses' || status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold">Clause Explanations</h2>
                    {status === 'explaining_clauses' && (
                      <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {(status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>

                  {status === 'explaining_clauses' && (
                    <p className="text-muted-foreground">Breaking down legal clauses into plain English...</p>
                  )}

                  {(status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && clauses.length > 0 && (
                    <div className="space-y-4">
                      {clauses.map((clause, index) => (
                        <div key={index} className="border rounded-lg">
                          <button
                            onClick={() => toggleClause(index)}
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-accent/50 transition-colors rounded-lg"
                          >
                            <h3 className="font-medium">{clause.clauseTitle}</h3>
                            {expandedClauses.has(index) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>

                          {expandedClauses.has(index) && (
                            <div className="p-4 pt-0 border-t">
                              {/* Plain English Explanation */}
                              <div className="mb-4">
                                <h4 className="font-medium text-sm mb-2 text-green-700 dark:text-green-400">
                                  What this means for you:
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {clause.plainEnglish}
                                </p>
                              </div>

                              {/* Original Legal Text */}
                              <div className="mb-4">
                                <h4 className="font-medium text-sm mb-2 text-gray-600 dark:text-gray-400">
                                  Original legal text:
                                </h4>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs font-mono leading-relaxed">
                                  {clause.originalText}
                                </div>
                              </div>

                              {/* Jargon Terms */}
                              {clause.jargon && clause.jargon.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2 text-blue-600 dark:text-blue-400">
                                    Legal terms explained:
                                  </h4>
                                  <div className="space-y-2">
                                    {clause.jargon.map((term, termIndex) => (
                                      <div key={termIndex} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                                        <span className="font-medium text-blue-700 dark:text-blue-300">
                                          {term.term}:
                                        </span>
                                        <span className="ml-2 text-muted-foreground">
                                          {term.definition}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {(status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete') && clauses.length === 0 && (
                    <p className="text-muted-foreground">No complex clauses found in this document.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 5: FAQ Generation */}
            {(status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
                    {status === 'generating_faqs' && (
                      <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {(status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>

                  {status === 'generating_faqs' && (
                    <p className="text-muted-foreground">Generating relevant questions and answers for your role...</p>
                  )}

                  {(status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && faqs.length > 0 && (
                    <div className="space-y-4">
                      {faqs.map((faq, index) => (
                        <div key={index} className="border rounded-lg">
                          <button
                            onClick={() => toggleFaq(index)}
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-accent/50 transition-colors rounded-lg"
                          >
                            <h3 className="font-medium">{faq.question}</h3>
                            {expandedFaqs.has(index) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>

                          {expandedFaqs.has(index) && (
                            <div className="p-4 pt-0 border-t">
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                                <p className="text-muted-foreground leading-relaxed">
                                  {faq.answer}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {(status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && faqs.length === 0 && (
                    <p className="text-muted-foreground">No relevant questions could be generated for this document.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 4: Missing Clause Detection */}
            {(status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold">Missing Clause Analysis</h2>
                    {status === 'detecting_missing' && (
                      <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
                    )}
                    {(status === 'missing_complete' || status === 'chat_ready') && (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>

                  {status === 'detecting_missing' && (
                    <p className="text-muted-foreground">Analyzing document for missing important clauses...</p>
                  )}

                  {(status === 'missing_complete' || status === 'chat_ready') && missingClauses && (
                    <div className="space-y-4">
                      {/* Overall Completeness Score */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Document Completeness</span>
                          <span className="text-sm font-medium">{missingClauses.overallCompleteness}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              missingClauses.overallCompleteness >= 80
                                ? 'bg-green-500'
                                : missingClauses.overallCompleteness >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${missingClauses.overallCompleteness}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{missingClauses.summary}</p>
                      </div>

                      {/* Missing Clauses List */}
                      {missingClauses.missingClauses.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-medium text-lg">Missing Clauses ({missingClauses.missingClauses.length})</h3>
                          {missingClauses.missingClauses.map((clause, index) => (
                            <div key={index} className="border rounded-lg">
                              <button
                                onClick={() => toggleMissingClause(index)}
                                className="w-full p-4 text-left flex items-center justify-between hover:bg-accent/50 transition-colors rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    clause.importance === 'Critical'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : clause.importance === 'Important'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  }`}>
                                    {clause.importance}
                                  </div>
                                  <h3 className="font-medium">{clause.clauseTitle}</h3>
                                </div>
                                {expandedMissingClauses.has(index) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>

                              <Collapsible open={expandedMissingClauses.has(index)}>
                                <CollapsibleContent className="px-4 pb-4">
                                  <div className="space-y-3 pt-2 border-t">
                                    <div>
                                      <h4 className="font-medium text-sm mb-1">What this clause would protect:</h4>
                                      <p className="text-sm text-muted-foreground">{clause.description}</p>
                                    </div>

                                    <div>
                                      <h4 className="font-medium text-sm mb-1">Risk without this clause:</h4>
                                      <p className="text-sm text-muted-foreground">{clause.riskWithoutClause}</p>
                                    </div>

                                    {clause.suggestedLanguage && (
                                      <div>
                                        <h4 className="font-medium text-sm mb-1">Suggested language:</h4>
                                        <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded">
                                          "{clause.suggestedLanguage}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          ))}
                        </div>
                      )}

                      {missingClauses.missingClauses.length === 0 && (
                        <div className="text-center py-6">
                          <div className="text-green-600 mb-2">✓</div>
                          <p className="text-muted-foreground">Excellent! This document appears to have all the important standard clauses for your protection.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 6: Chat Interface */}
            {status === 'chat_ready' && documentContext && (
              <ChatInterface
                documentContext={documentContext}
                onSendMessage={handleChatMessage}
                className="w-full"
              />
            )}

            {/* Analysis Complete - Export & Reset Options */}
            {status === 'chat_ready' && documentContext && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-2 text-center">Analysis Complete</h2>
                  <p className="text-muted-foreground mb-6 text-center">
                    Your document has been analyzed for key numbers, risk factors, missing clauses, and legal details.
                  </p>

                  {/* Export Options */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-medium text-center">Export & Share</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        onClick={handleExportPDF}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>

                      <Button
                        onClick={handleCopyToClipboard}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Summary
                      </Button>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <Button
                    onClick={handleReset}
                    variant="default"
                    className="w-full"
                  >
                    {t('analyze_new_document')}
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>
      </main>

      {/* Vertical Dock - Desktop */}
      {dockComponent}

      {/* Mobile Action Buttons */}
      {showDock && (
        <div className="md:hidden fixed bottom-4 right-4 z-40 flex flex-col gap-3">
          <Button
            size="icon"
            onClick={handleChatHistoryClick}
            className="h-12 w-12 rounded-full shadow-lg"
            title="Chat History"
          >
            <History className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            onClick={handleExportClick}
            className="h-12 w-12 rounded-full shadow-lg"
            title="Export"
            disabled={!documentContext || !missingClauses}
          >
            <DownloadIcon className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            onClick={handleSettingsClick}
            className="h-12 w-12 rounded-full shadow-lg"
            title="Settings"
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            onClick={handleComparisonClick}
            className="h-12 w-12 rounded-full shadow-lg"
            title="Compare Documents"
            disabled={!documentContext}
          >
            <FileQuestion className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Chat History Panel */}
      <ChatHistoryPanel
        isOpen={isChatHistoryOpen}
        onClose={() => setIsChatHistoryOpen(false)}
        className="w-80 md:w-96"
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        className="w-80 md:w-96"
      />

      {/* Document Comparison Panel */}
      {documentContext && (
        <DocumentComparisonPanel
          isOpen={isComparisonOpen}
          onClose={() => setIsComparisonOpen(false)}
          currentDocument={documentContext}
        />
      )}

      {/* General Chatbot */}
      <GeneralChatbot />
      </div>
    </ErrorBoundary>
  );
}
