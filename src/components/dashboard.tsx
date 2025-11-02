'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  ScrollText,
  NotebookTabs as TabsIcon,
  CalendarPlus,
} from 'lucide-react';
import { suggestRole, extractDocumentKeyNumbers, assessDocumentRiskLevel, explainDocumentClauses, generateDocumentFAQs, detectDocumentTypeFromText, sendChatMessage, generateSuggestedQuestions, detectMissingClausesInDocument } from '@/app/actions';
import { DocumentReportExporter } from '@/lib/export-utils';
import type { ExtractKeyNumbersOutput, KeyNumber } from '@/ai/flows/extract-key-numbers';
import type { AssessDocumentRiskOutput } from '@/ai/flows/assess-document-risk';
import type { ExplainClausesOutput, ClauseExplanation } from '@/ai/flows/explain-clauses';
import type { GenerateFaqOutput, FAQItem } from '@/ai/flows/generate-faq';
import type { DetectMissingClausesOutput } from '@/ai/flows/detect-missing-clauses';
import type { DetectDocumentTypeOutput, DocumentType, Document } from '@/types/document-types';
import type { DocumentContext, ChatMessage } from '@/types/chat-types';
import { ChatInterface } from './chat-interface';
import Link from 'next/link';
import { VerticalDock, VerticalDockItem, VerticalDockIcon, VerticalDockLabel } from '@/components/ui/vertical-dock';
import { HorizontalDock, HorizontalDockItem, HorizontalDockIcon, HorizontalDockLabel } from '@/components/ui/horizontal-dock';
import { ChatHistoryPanel } from '@/components/panels/chat-history-panel';
import { SettingsPanel } from '@/components/panels/settings-panel';
import { DocumentComparisonPanel } from '@/components/panels/document-comparison-panel';
import { DocumentGeneratorPanel } from '@/components/panels/document-generator-panel';
import { UserPreferencesService } from '@/lib/user-preferences';
import {
  MessageSquare,
  History,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  FileQuestion,
  Sparkles
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { ThemeToggle } from './theme-toggle';
import { useLanguage } from '@/contexts/language-context';
import { LanguageSelector } from './language-selector';
import { useTranslation } from '@/lib/translations';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import ErrorBoundary from '@/components/error-boundary';
import { EnhancedLoading, FileUploadLoading } from '@/components/ui/enhanced-loading';
import { LegalNotebook } from './legal-notebook';
import { buildGoogleCalendarURL } from '@/lib/calendar-utils';
import { TabBar, createAnalysisTabs, type AnalysisTabId } from '@/components/ui/tab-bar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TabContent } from '@/components/ui/tab-content';
import { getConfidenceBin, getRiskCategory, getRiskBarColor } from '@/lib/score-bins';

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
  | 'error'
  | 'notebook_view';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = useTranslation(language);

  function looksLikeDate(str: string) {
    if (!str) return false;

    const normalized = str.trim().toLowerCase();
    const hasMonthName = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(normalized);
    const hasDateSeparator = /[\/\-]/.test(normalized);
    const hasYear = /\b(19|20)\d{2}\b/.test(normalized);

    if (normalized.length < 6) return false;
    if (/^\d+$/.test(normalized)) return false;

    if (hasMonthName || hasDateSeparator || hasYear) {
      const d = new Date(str);
      return !isNaN(d.getTime());
    }

    return false;
  }


  const [status, setStatus] = useState<Status>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Dock panel states
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState(UserPreferencesService.loadPreferences());
  const [notebookDocument, setNotebookDocument] = useState<Document | null>(null);

  // Handler to update user preferences
  const handlePreferenceChange = useCallback((category: string, key: string, value: any) => {
    UserPreferencesService.setPreference(category as any, key, value);
    setUserPreferences(UserPreferencesService.loadPreferences());
  }, []);

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

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

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

  // Completion tracking to prevent sections from disappearing
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Refs for scrolling to analysis sections
  const keyNumbersRef = useRef<HTMLDivElement>(null);
  const riskAssessmentRef = useRef<HTMLDivElement>(null);
  const clausesRef = useRef<HTMLDivElement>(null);
  const faqsRef = useRef<HTMLDivElement>(null);
  const missingClausesRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Tab view state
  const [activeTab, setActiveTab] = useState<AnalysisTabId>('keyNumbers');

  const userRole = useMemo(() => {
    return selectedRoleOption === 'other' ? customRole : selectedRoleOption;
  }, [selectedRoleOption, customRole]);

  const canAnalyze = useMemo(() => {
    const hasInput = inputMethod === 'upload' ? file : (pastedText.length >= 100);
    return hasInput && userRole;
  }, [file, pastedText, userRole, inputMethod]);

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

  // Scroll to analysis section when progress step is clicked
  const handleProgressStepClick = useCallback((stepId: string) => {
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
      'extracting_numbers': keyNumbersRef,
      'assessing_risk': riskAssessmentRef,
      'explaining_clauses': clausesRef,
      'generating_faqs': faqsRef,
      'detecting_missing': missingClausesRef,
      'chat_ready': chatRef,
    };

    const targetRef = refMap[stepId];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      // Add a subtle pulse animation to highlight the section
      targetRef.current.style.animation = 'pulse 0.5s ease-in-out';
      setTimeout(() => {
        if (targetRef.current) {
          targetRef.current.style.animation = '';
        }
      }, 500);
    }
  }, []);

  // Helper function to determine if a section should be visible
  const shouldShowSection = useCallback((sectionStatus: string): boolean => {
    // Check if currently processing this step
    if (status === sectionStatus) return true;

    // Map section statuses to their completion statuses
    const completeStatusMap: Record<string, string> = {
      'extracting_numbers': 'numbers_complete',
      'assessing_risk': 'risk_complete',
      'explaining_clauses': 'clauses_complete',
      'generating_faqs': 'faqs_complete',
      'detecting_missing': 'missing_complete'
    };

    // Check if the corresponding complete status exists
    const completeStatus = completeStatusMap[sectionStatus];
    if (completeStatus && completedSteps.has(completeStatus)) return true;

    // Also check for direct status match
    if (completedSteps.has(sectionStatus)) return true;

    return false;
  }, [status, completedSteps]);

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

  // Helper function to check if a file is an image
  const isImageFile = (file: File): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(extension) || file.type.startsWith('image/');
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

        // Create image preview if it's an image file
        if (isImageFile(selectedFile)) {
          const previewUrl = URL.createObjectURL(selectedFile);
          setImagePreviewUrl(previewUrl);
        } else {
          setImagePreviewUrl(null);
        }

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

          // Check if document type detection failed (confidence 0 indicates API error)
          if (typeResult.confidence === 0 || typeResult.documentType === 'Unclassified Document') {
            console.error('Document type detection failed:', typeResult);
            toast({
              variant: 'destructive',
              title: 'Document Type Detection Failed',
              description: typeResult.reasoning || 'Unable to detect document type. Analysis will continue with generic settings. Check console for details.',
              duration: 10000, // Longer duration (10s) for debugging
            });
          }

          // Move to role suggestion
          setStatus('suggesting_role');

          const role = await suggestRole(parseResult.text);

          // Check if role suggestion failed (empty string indicates API error)
          if (!role || role.trim() === '') {
            toast({
              variant: 'destructive',
              title: 'Role Suggestion Failed',
              description: 'Unable to suggest your role. Please select it manually below.',
            });
            setSuggestedRole('');
            setSelectedRoleOption('other'); // Default to "other" so user can input manually
          } else {
            setSuggestedRole(role);
            setSelectedRoleOption(role);
          }

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
            errorDescription = 'Please upload a supported file: .txt, .pdf, .docx, or images (.jpg, .png, .gif, .bmp, .tiff, .webp). Other formats are not currently supported.';
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
    // Clean up image preview URL if it exists
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }

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
    setCompletedSteps(new Set()); // Clear completion tracking
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
      setCompletedSteps(prev => new Set([...prev, 'numbers_complete']));

      // Small delay to show the waterfall effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Assess Document Risk (with document type context)
      setStatus('assessing_risk');
      const riskResult = await assessDocumentRiskLevel(documentText, userRole, documentType);
      setRiskScore(riskResult.riskScore);
      setRiskSummary(riskResult.riskSummary);
      setStatus('risk_complete');
      setCompletedSteps(prev => new Set([...prev, 'risk_complete']));

      // Small delay to show the waterfall effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Explain Legal Clauses
      setStatus('explaining_clauses');
      const clausesResult = await explainDocumentClauses(documentText, userRole);
      setClauses(clausesResult.clauses);
      setStatus('clauses_complete');
      setCompletedSteps(prev => new Set([...prev, 'clauses_complete']));

      // Small delay to show the waterfall effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Generate FAQs
      setStatus('generating_faqs');
      const faqsResult = await generateDocumentFAQs(documentText, userRole);
      setFaqs(faqsResult.faqs);
      setStatus('faqs_complete');
      setCompletedSteps(prev => new Set([...prev, 'faqs_complete']));

      // Small delay to show the waterfall effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 5: Detect Missing Clauses
      setStatus('detecting_missing');
      const missingClausesResult = await detectMissingClausesInDocument(documentText, userRole, documentType);
      setMissingClauses(missingClausesResult);
      setStatus('missing_complete');
      setCompletedSteps(prev => new Set([...prev, 'missing_complete']));

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
  const isAnalyzing = status === 'extracting_numbers' || status === 'numbers_complete' ||
                      status === 'assessing_risk' || status === 'risk_complete' ||
                      status === 'explaining_clauses' || status === 'clauses_complete' ||
                      status === 'generating_faqs' || status === 'faqs_complete' ||
                      status === 'detecting_missing' || status === 'missing_complete';

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

  // Dock is always shown now (no hidden option)
  const showDock = true;
  const dockPosition = userPreferences.ui.dockPosition;

  // Memoized dock component to prevent re-renders from affecting animations
  const dockComponent = useMemo(() => {
    if (!showDock) return null;

    return (
      <div className={`hidden md:block fixed z-40 ${
        dockPosition === 'bottom'
          ? 'bottom-4 left-1/2 -translate-x-1/2'
          : `top-1/2 -translate-y-1/2 ${dockPosition === 'left' ? 'left-4' : 'right-4'}`
      }`}>
        {dockPosition === 'bottom' ? (
          <HorizontalDock key="main-dock">
            <HorizontalDockItem onClick={handleChatHistoryClick}>
              <HorizontalDockIcon>
                <History className="h-6 w-6" />
              </HorizontalDockIcon>
              <HorizontalDockLabel>Chat History</HorizontalDockLabel>
            </HorizontalDockItem>

            <HorizontalDockItem onClick={handleExportClick}>
              <HorizontalDockIcon>
                <DownloadIcon className="h-6 w-6" />
              </HorizontalDockIcon>
              <HorizontalDockLabel>Export</HorizontalDockLabel>
            </HorizontalDockItem>

            <HorizontalDockItem onClick={() => setIsGeneratorOpen(true)}>
              <HorizontalDockIcon>
                <Sparkles className="h-6 w-6" />
              </HorizontalDockIcon>
              <HorizontalDockLabel>Generate</HorizontalDockLabel>
            </HorizontalDockItem>

            <HorizontalDockItem onClick={handleSettingsClick}>
              <HorizontalDockIcon>
                <SettingsIcon className="h-6 w-6" />
              </HorizontalDockIcon>
              <HorizontalDockLabel>Settings</HorizontalDockLabel>
            </HorizontalDockItem>

            <HorizontalDockItem onClick={handleComparisonClick}>
              <HorizontalDockIcon>
                <FileQuestion className="h-6 w-6" />
              </HorizontalDockIcon>
              <HorizontalDockLabel>Compare</HorizontalDockLabel>
            </HorizontalDockItem>
          </HorizontalDock>
        ) : (
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

            <VerticalDockItem onClick={() => setIsGeneratorOpen(true)}>
              <VerticalDockIcon>
                <Sparkles className="h-6 w-6" />
              </VerticalDockIcon>
              <VerticalDockLabel>Generate</VerticalDockLabel>
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
        )}
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

  if (status === 'notebook_view' && notebookDocument) {
    return (
      <LegalNotebook
        document={notebookDocument}
        onClose={() => setStatus('chat_ready')}
      />
    );
  }

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

            {/* Analysis View Mode Toggle and Notebook Button */}
            {(status === 'ready' || isAnalyzing || status === 'missing_complete' || status === 'chat_ready') && (
              <div className="flex items-center justify-between gap-3 mb-2">
                {/* Left: View Mode Toggle */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium text-muted-foreground">View Mode:</Label>
                  <div className="inline-flex rounded-lg border bg-background p-1">
                    <Button
                      variant={userPreferences.ui.analysisViewMode === 'scroll' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8"
                      onClick={() => handlePreferenceChange('ui', 'analysisViewMode', 'scroll')}
                    >
                      <ScrollText className="h-4 w-4 mr-1.5" />
                      Scroll
                    </Button>
                    <Button
                      variant={userPreferences.ui.analysisViewMode === 'tabs' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8"
                      onClick={() => handlePreferenceChange('ui', 'analysisViewMode', 'tabs')}
                    >
                      <TabsIcon className="h-4 w-4 mr-1.5" />
                      Tabs
                    </Button>
                  </div>
                </div>

                {/* Right: Open in Notebook Button */}
                {file && (
                  <Button
                    onClick={() => {
                      if (documentContext) {
                        setNotebookDocument({
                          id: '1',
                          title: file?.name || 'Document',
                          content: documentContext.documentText,
                          createdAt: new Date(),
                          documentType,
                          documentTypeConfidence,
                          userRole,
                          analysis: {
                            documentType,
                            documentTypeConfidence,
                            keyNumbers,
                            riskScore: riskScore ?? undefined,
                            riskSummary,
                            missingClauses: missingClauses ?? undefined,
                            clauses,
                            faqs,
                          },
                        });
                        setStatus('notebook_view');
                      }
                    }}
                    variant="default"
                    size="sm"
                    disabled={status !== 'chat_ready' || !documentContext}
                    className={status !== 'chat_ready' ? 'opacity-50 cursor-not-allowed' : 'glow-border gap-2'}
                  >
                    <TabsIcon className="h-4 w-4" />
                    Open in Notebook
                  </Button>
                )}
              </div>
            )}

            {/* Grid Layout: Progress Indicator (left) + Analyze Document Card (right) */}
            {(isAnalyzing || status === 'missing_complete') ? (
              <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
                {/* Left: Compact Progress Indicator (order-2 on mobile, order-1 on desktop) */}
                <div className="order-2 md:order-1">
                  <ProgressIndicator
                    currentStep={status}
                    showDetailedView={false}
                    className="w-full md:sticky md:top-20"
                    onStepClick={handleProgressStepClick}
                  />
                </div>

                {/* Right: Analyze Document Card (order-1 on mobile, order-2 on desktop) */}
                <div className="order-1 md:order-2">
                  <Card>
              <CardContent className="space-y-6 p-6">
                {/* Tab Switcher for Input Method */}
                <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'upload' | 'paste')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="upload">
                      <UploadCloud className="h-4 w-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="paste">
                      <FileText className="h-4 w-4 mr-2" />
                      Paste Text
                    </TabsTrigger>
                  </TabsList>

                  {/* Upload File Tab */}
                  <TabsContent value="upload" className="mt-0">
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
                        accept=".txt,.pdf,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif,.webp"
                        disabled={isProcessing}
                      />
                      {file ? (
                        <div className="text-center text-primary">
                          {imagePreviewUrl ? (
                            <div className="relative w-full max-w-md mx-auto">
                              <img
                                src={imagePreviewUrl}
                                alt={file.name}
                                className="mx-auto max-h-48 rounded-lg object-contain border-2 border-primary/20"
                              />
                            </div>
                          ) : (
                            <FileText className="mx-auto h-12 w-12" />
                          )}
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
                          <p className="mt-2 text-xs">Supports .txt, .pdf, .docx, and images (.jpg, .png, .gif, .bmp, .tiff, .webp)</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Paste Text Tab */}
                  <TabsContent value="paste" className="mt-0">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Paste your document text here... (Minimum 100 characters)"
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        className="min-h-[200px] resize-y"
                        disabled={isProcessing}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{pastedText.length} characters</span>
                        {pastedText.length > 0 && pastedText.length < 100 && (
                          <span className="text-orange-500">Minimum 100 characters required</span>
                        )}
                        {pastedText.length >= 100 && (
                          <span className="text-green-500">Ready to analyze</span>
                        )}
                      </div>
                      {pastedText.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPastedText('')}
                          className="w-full"
                        >
                          Clear Text
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Show role selection and analyze button for both file upload and pasted text */}
                {((inputMethod === 'upload' && file) || (inputMethod === 'paste' && pastedText.length >= 100)) && !isProcessing && (
                  <div className="space-y-4">
                    {/* Document Type Display */}
                    {documentType && documentType !== 'Unclassified Document' && (
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
                          <div className={`mt-1 text-xs font-medium ${getConfidenceBin(documentTypeConfidence).color}`}>
                            {getConfidenceBin(documentTypeConfidence).label}
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
                  onClick={() => {
                    // For pasted text, set documentText and create a synthetic file object
                    if (inputMethod === 'paste' && pastedText) {
                      setDocumentText(pastedText);
                      setFile(new File([pastedText], 'Pasted Document.txt', { type: 'text/plain' }));
                      setStatus('ready');
                      // Trigger analysis after state is set
                      setTimeout(() => handleAnalyze(), 0);
                    } else {
                      handleAnalyze();
                    }
                  }}
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
                </div>
              </div>
            ) : (
              <Card>
              <CardContent className="space-y-6 p-6">
                <div
                  className={`relative flex min-h-[200px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    isDragging ? 'border-primary bg-accent' : ''
                  } ${status === 'idle' ? 'glow-border-dashed' : ''}`}
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
                    accept=".txt,.pdf,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif,.webp"
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
                      {imagePreviewUrl ? (
                        <div className="relative w-full max-w-md mx-auto">
                          <img
                            src={imagePreviewUrl}
                            alt={file.name}
                            className="mx-auto max-h-48 rounded-lg object-contain border-2 border-primary/20"
                          />
                        </div>
                      ) : (
                        <FileText className="mx-auto h-12 w-12" />
                      )}
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
                      <p className="mt-2 text-xs">Supports .txt, .pdf, .docx, and images (.jpg, .png, .gif, .bmp, .tiff, .webp)</p>
                    </div>
                  )}
                </div>

                {file && !isProcessing && (
                  <div className="space-y-4">
                    {/* Document Type Display */}
                    {documentType && documentType !== 'Unclassified Document' && (
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
                          <div className={`mt-1 text-xs font-medium ${getConfidenceBin(documentTypeConfidence).color}`}>
                            {getConfidenceBin(documentTypeConfidence).label}
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
                  onClick={() => {
                    // For pasted text, set documentText and create a synthetic file object
                    if (inputMethod === 'paste' && pastedText) {
                      setDocumentText(pastedText);
                      setFile(new File([pastedText], 'Pasted Document.txt', { type: 'text/plain' }));
                      setStatus('ready');
                      // Trigger analysis after state is set
                      setTimeout(() => handleAnalyze(), 0);
                    } else {
                      handleAnalyze();
                    }
                  }}
                  disabled={!canAnalyze || isProcessing || isAnalyzing}
                  className={`w-full ${status === 'ready' && !isAnalyzing && !isProcessing ? 'glow-border' : ''}`}
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
            )}

            {/* Tab View (when enabled) */}
            {userPreferences.ui.analysisViewMode === 'tabs' && (status === 'ready' || isAnalyzing || status === 'missing_complete' || status === 'chat_ready') && (
              <>
                <Card>
                  <TabBar
                    tabs={createAnalysisTabs(
                      keyNumbers.length,
                      riskScore,
                      clauses.length,
                      faqs.length,
                      missingClauses?.missingClauses?.length || 0,
                      status,
                      completedSteps
                    ).map(tab => ({ ...tab, isActive: tab.id === activeTab }))}
                    activeTab={activeTab}
                    onTabClick={setActiveTab}
                  />
                  <TabContent
                    activeTab={activeTab}
                    keyNumbers={keyNumbers}
                    keyNumbersStatus={status}
                    riskScore={riskScore}
                    riskSummary={riskSummary}
                    riskStatus={status}
                    clauses={clauses}
                    expandedClauses={expandedClauses}
                    onToggleClause={(index) => {
                      setExpandedClauses(prev => {
                        const next = new Set(prev);
                        if (next.has(index)) {
                          next.delete(index);
                        } else {
                          next.add(index);
                        }
                        return next;
                      });
                    }}
                    clausesStatus={status}
                    faqs={faqs}
                    expandedFaqs={expandedFaqs}
                    onToggleFaq={(index) => {
                      setExpandedFaqs(prev => {
                        const next = new Set(prev);
                        if (next.has(index)) {
                          next.delete(index);
                        } else {
                          next.add(index);
                        }
                        return next;
                      });
                    }}
                    faqsStatus={status}
                    missingClauses={missingClauses}
                    expandedMissingClauses={expandedMissingClauses}
                    onToggleMissingClause={(index) => {
                      setExpandedMissingClauses(prev => {
                        const next = new Set(prev);
                        if (next.has(index)) {
                          next.delete(index);
                        } else {
                          next.add(index);
                        }
                        return next;
                      });
                    }}
                    missingStatus={status}
                    documentContext={documentContext}
                    onSendMessage={handleChatMessage}
                  />
                </Card>
              </>
            )}

            {/* Scroll View (default/when enabled) */}
            {userPreferences.ui.analysisViewMode === 'scroll' && (
              <>
            {/* Step 1: Key Numbers Analysis */}
            {shouldShowSection('extracting_numbers') && (
              <Card key="key-numbers-section" ref={keyNumbersRef}>
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
                      {keyNumbers.map((item, index) => {
                        const calendarURL = looksLikeDate(item.value)
                          ? buildGoogleCalendarURL({
                              label: item.label,
                              dateString: item.value,
                              description: 'This was extracted as an important date/deadline from your uploaded document.'
                            })
                          : null;

                        return (
                          <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-accent/50 rounded-lg gap-2">
                            <span className="font-medium text-sm">{item.label}</span>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <span className="text-sm text-muted-foreground">{item.value}</span>
                              {calendarURL && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a href={calendarURL} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="icon" className="h-8 w-8">
                                          <CalendarPlus className="h-4 w-4" />
                                        </Button>
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add to Google Calendar</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(status === 'numbers_complete' || status === 'assessing_risk' || status === 'risk_complete' || status === 'explaining_clauses' || status === 'clauses_complete' || status === 'generating_faqs' || status === 'faqs_complete' || status === 'detecting_missing' || status === 'missing_complete' || status === 'chat_ready') && keyNumbers.length === 0 && (
                    <p className="text-muted-foreground">No key numbers or dates found in this document.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Risk Assessment */}
            {shouldShowSection('assessing_risk') && (
              <Card key="risk-assessment-section" ref={riskAssessmentRef}>
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
                      {/* Risk Assessment Display */}
                      <div className="space-y-2">
                        {/* Risk Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${getRiskBarColor(riskScore)}`}
                            style={{ width: `${riskScore}%` }}
                          />
                        </div>

                        {/* Risk Level Label */}
                        <p className={`text-base font-semibold text-center ${getRiskCategory(riskScore).color}`}>
                          {getRiskCategory(riskScore).label}
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
            {shouldShowSection('explaining_clauses') && (
              <Card key="clauses-section" ref={clausesRef}>
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
            {shouldShowSection('generating_faqs') && (
              <Card key="faqs-section" ref={faqsRef}>
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
            {shouldShowSection('detecting_missing') && (
              <Card key="missing-clauses-section" ref={missingClausesRef}>
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
              <div ref={chatRef}>
                <ChatInterface
                  documentContext={documentContext}
                  onSendMessage={handleChatMessage}
                  className="w-full"
                />
              </div>
            )}
            </>
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

      {/* Document Generator Panel */}
      <DocumentGeneratorPanel
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        documentContext={documentContext}
      />
      </div>
    </ErrorBoundary>
  );
}