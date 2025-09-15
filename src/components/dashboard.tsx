
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import {
  AlertCircle,
  ChevronDown,
  FileText,
  LoaderCircle,
  LogOut,
  UploadCloud,
  Settings,
  MessageSquarePlus,
} from 'lucide-react';
import type { AnalysisResult, LanguageCode } from '@/lib/types';
import {
  suggestRole,
  getRisk,
  getKeyNumbers,
  getExplainedClauses,
  getFaq,
  getMissingClauses,
} from '@/app/actions';
import Link from 'next/link';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import RiskMeter from './risk-meter';
import KeyNumbers from './key-numbers';
import ClauseBreakdown from './clause-breakdown';
import FaqSection from './faq-section';
import { ThemeToggle } from './theme-toggle';
import { useLanguage } from '@/contexts/language-context';
import { LanguageSelector } from './language-selector';
import { useTranslation } from '@/lib/translations';
import ChatInterface from './chat-interface';
import MissingClauses from './missing-clauses';
import { Skeleton } from './ui/skeleton';

type Status =
  | 'idle'
  | 'suggesting_role'
  | 'processing'
  | 'success'
  | 'error';
type AnalysisStatus =
  | 'idle'
  | 'risk'
  | 'keyNumbers'
  | 'clauses'
  | 'faq'
  | 'missing'
  | 'done';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = useTranslation(language);

  const [status, setStatus] = useState<Status>('idle');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Partial<AnalysisResult>>(
    {}
  );
  const [error, setError] = useState<string>('');

  const [suggestedRole, setSuggestedRole] = useState('');
  const [selectedRoleOption, setSelectedRoleOption] = useState('');
  const [customRole, setCustomRole] = useState('');

  const userRole = useMemo(() => {
    return selectedRoleOption === 'other' ? customRole : selectedRoleOption;
  }, [selectedRoleOption, customRole]);

  const canAnalyze = useMemo(() => file && userRole, [file, userRole]);

  const handleFileChange = useCallback(
    async (selectedFile: File | null) => {
      if (selectedFile) {
        if (
          selectedFile.type === 'application/pdf' ||
          selectedFile.type ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          selectedFile.type.startsWith('text/')
        ) {
          setFile(selectedFile);
          setStatus('suggesting_role');
          setSuggestedRole('');
          setSelectedRoleOption('');
          setCustomRole('');
          try {
            const fileText = await selectedFile.text();
            setDocumentText(fileText); // Save document text
            const role = await suggestRole(fileText);
            setSuggestedRole(role);
            setSelectedRoleOption(role);
          } catch (e) {
            const errorMessage =
              e instanceof Error ? e.message : 'Could not suggest a role.';
            toast({
              variant: 'destructive',
              title: t('role_suggestion_failed'),
              description: errorMessage,
            });
            // Fallback to allow user to enter role manually
            setSuggestedRole('Analyst');
            setSelectedRoleOption('other');
          } finally {
            setStatus('idle');
          }
        } else {
          toast({
            variant: 'destructive',
            title: t('unsupported_file_type_title'),
            description: t('unsupported_file_type_description'),
          });
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

  const handleAnalysis = async () => {
    if (!canAnalyze || !documentText) return;

    setStatus('processing');
    setError('');
    setAnalysisResult({});
    setAnalysisStatus('idle');

    try {
      const commonInput = {
        documentText,
        userRole,
        language: language as LanguageCode,
      };

      setAnalysisStatus('risk');
      const risk = await getRisk({
        documentText: commonInput.documentText,
        userRole: commonInput.userRole,
        language: t.languageName,
      });
      setAnalysisResult((prev) => ({ ...prev, riskAssessment: risk }));

      setAnalysisStatus('keyNumbers');
      const keyNumbersResult = await getKeyNumbers({
        documentText: commonInput.documentText,
        language: t.languageName,
      });
      setAnalysisResult((prev) => ({
        ...prev,
        keyNumbers: keyNumbersResult.keyNumbers,
      }));
      
      setAnalysisStatus('missing');
      const missingClausesResult = await getMissingClauses({
        documentText: commonInput.documentText,
        userRole: commonInput.userRole,
        language: t.languageName,
      });
      setAnalysisResult((prev) => ({
        ...prev,
        missingClauses: missingClausesResult,
      }));

      setAnalysisStatus('clauses');
      const explainedClauses = await getExplainedClauses(
        commonInput.documentText,
        commonInput.userRole,
        language as LanguageCode
      );
      setAnalysisResult((prev) => ({
        ...prev,
        clauseBreakdown: explainedClauses,
      }));

      setAnalysisStatus('faq');
      const faqResult = await getFaq({
        documentText: commonInput.documentText,
        userRole: commonInput.userRole,
        language: t.languageName,
      });
      setAnalysisResult((prev) => ({ ...prev, faq: faqResult }));

      setAnalysisStatus('done');
      setStatus('success');
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setStatus('error');
      toast({
        variant: 'destructive',
        title: t('analysis_error'),
        description: errorMessage,
      });
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setAnalysisStatus('idle');
    setFile(null);
    setDocumentText('');
    setAnalysisResult({});
    setError('');
    setSuggestedRole('');
    setSelectedRoleOption('');
    setCustomRole('');
  };

  const isProcessing = status === 'processing' || status === 'suggesting_role';

  const analysisStepMessages: Record<AnalysisStatus, string> = {
    idle: t('starting_analysis'),
    risk: t('analyzing_risk'),
    keyNumbers: t('extracting_key_numbers'),
    missing: t('checking_for_missing_clauses'),
    clauses: t('breaking_down_clauses'),
    faq: t('generating_faqs'),
    done: t('compiling_report'),
  };

  const AnalysisSkeleton = ({ title, description, lines = 3 }: { title: string; description: string; lines?: number }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className={`h-8 w-1/${lines > 1 ? '3' : '2'}`} />
        {[...Array(lines-1)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">Legalease AI</span>
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
          {status !== 'processing' && status !== 'success' && (
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {t('legal_document_analysis')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('upload_and_get_insights')}
              </p>
            </div>
          )}

          {status !== 'processing' && status !== 'success' && (
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
                    accept=".pdf,.docx,.txt"
                    disabled={isProcessing}
                  />
                  {status === 'suggesting_role' ? (
                    <div className="text-center">
                      <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-primary" />
                      <p className="mt-4 text-lg font-medium">
                        {t('suggesting_role')}
                      </p>
                    </div>
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
                      <p className="mt-2 text-xs">{t('file_types')}</p>
                    </div>
                  )}
                </div>

                {file && !isProcessing && (
                  <div className="space-y-4">
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
                  onClick={handleAnalysis}
                  disabled={!canAnalyze || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {t('analyze_document')}
                </Button>
              </CardContent>
            </Card>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('analysis_error')}</AlertTitle>
              <AlertDescription>
                {error} {t('try_again_or_contact_support')}
              </AlertDescription>
            </Alert>
          )}

          {(status === 'processing' || status === 'success') && (
            <div className="space-y-8">
              <div className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-bold">{file?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('role')}: {userRole}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ChatInterface
                    documentText={documentText}
                    userRole={userRole}
                  >
                    <Button
                      variant="outline"
                      disabled={status !== 'success'}
                    >
                      <MessageSquarePlus className="mr-2 h-4 w-4" />
                      {t('ask_the_ai')}
                    </Button>
                  </ChatInterface>
                  <Button onClick={handleReset} variant="default">
                    {t('analyze_new_document')}
                  </Button>
                </div>
              </div>
              
              {isProcessing && analysisStatus !== 'idle' && (
                <div className='flex items-center justify-center gap-2 p-4 text-muted-foreground'>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  <span>{analysisStepMessages[analysisStatus]}</span>
                </div>
              )}

              {analysisResult.riskAssessment ? (
                <RiskMeter
                  riskScore={analysisResult.riskAssessment.riskScore}
                  riskLevel={analysisResult.riskAssessment.riskLevel}
                  summary={analysisResult.riskAssessment.summary}
                />
              ) : (
                isProcessing && analysisStatus === 'risk' &&
                <AnalysisSkeleton title={t('risk_meter')} description={t('risk_assessment_description')} />
              )}
              
              {analysisResult.missingClauses ? (
                <MissingClauses missingClauses={analysisResult.missingClauses} />
              ) : (
                isProcessing && analysisStatus === 'missing' &&
                <AnalysisSkeleton title={t('missing_clause_detector')} description={t('missing_clause_description')} />
              )}

              {analysisResult.keyNumbers ? (
                <KeyNumbers keyNumbers={analysisResult.keyNumbers} />
              ) : (
                isProcessing && analysisStatus === 'keyNumbers' &&
                <AnalysisSkeleton title={t('key_numbers_dates')} description={t('key_numbers_description')} />
              )}

              {analysisResult.clauseBreakdown ? (
                <ClauseBreakdown clauses={analysisResult.clauseBreakdown} />
              ) : (
                isProcessing && analysisStatus === 'clauses' &&
                <AnalysisSkeleton title={t('clause_breakdown')} description={t('clause_breakdown_description')} lines={5} />
              )}

              {analysisResult.faq ? (
                <FaqSection faqData={analysisResult.faq} />
              ) : (
                isProcessing && analysisStatus === 'faq' &&
                <AnalysisSkeleton title={t('ai_generated_faqs')} description={t('faq_description')} lines={5} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
