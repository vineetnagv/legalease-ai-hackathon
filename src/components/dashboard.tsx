// @ts-nocheck
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import {
  AlertCircle,
  ChevronDown,
  FileText,
  LoaderCircle,
  LogOut,
  UploadCloud,
  Settings,
} from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { analyzeDocument, suggestRole } from '@/app/actions';
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
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import RiskMeter from './risk-meter';
import KeyNumbers from './key-numbers';
import ClauseBreakdown from './clause-breakdown';

type Status = 'idle' | 'suggesting_role' | 'processing' | 'success' | 'error';

const LOADING_MESSAGES = [
  'Uploading document...',
  'Extracting text...',
  'Analyzing with AI... this may take a moment.',
  'Compiling your report...',
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [status, setStatus] = useState<Status>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState<string>('');
  const [loadingStep, setLoadingStep] = useState(0);

  const [suggestedRole, setSuggestedRole] = useState('');
  const [selectedRoleOption, setSelectedRoleOption] = useState('');
  const [customRole, setCustomRole] = useState('');

  const userRole = useMemo(() => {
    return selectedRoleOption === 'other' ? customRole : selectedRoleOption;
  }, [selectedRoleOption, customRole]);

  const canAnalyze = useMemo(() => file && userRole, [file, userRole]);

  const handleFileChange = useCallback(async (selectedFile: File | null) => {
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || selectedFile.type.startsWith('text/')) {
        setFile(selectedFile);
        setStatus('suggesting_role');
        setSuggestedRole('');
        setSelectedRoleOption('');
        setCustomRole('');
        try {
          const fileText = await selectedFile.text();
          const role = await suggestRole(fileText);
          setSuggestedRole(role);
          setSelectedRoleOption(role);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Could not suggest a role.';
            toast({
              variant: 'destructive',
              title: 'Role Suggestion Failed',
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
          title: 'Unsupported File Type',
          description: 'Please upload a PDF, DOCX, or a plain text file.',
        });
      }
    }
  }, [toast]);


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
    if (!canAnalyze) return;

    setStatus('processing');
    setError('');
    setAnalysisResult(null);
    setLoadingStep(0);

    const loadingInterval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    try {
      const fileText = await file.text();
      const result = await analyzeDocument(fileText, userRole);
      setAnalysisResult(result);
      setStatus('success');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setStatus('error');
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: errorMessage,
      });
    } finally {
      clearInterval(loadingInterval);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setFile(null);
    setAnalysisResult(null);
    setError('');
    setSuggestedRole('');
    setSelectedRoleOption('');
    setCustomRole('');
  };

  const isRoleSelectionDisabled = status === 'processing' || status === 'suggesting_role';

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">Legalease AI</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? 'User'} />
                <AvatarFallback>
                  {user?.displayName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">{user?.displayName}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
                <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              AI Legal Document Analysis
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload your document, confirm your role, and get instant insights.
            </p>
          </div>

          {status !== 'success' && (
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
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    accept=".pdf,.docx,.txt"
                    disabled={isRoleSelectionDisabled}
                  />
                  {isRoleSelectionDisabled ? (
                    <div className="text-center">
                      <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-primary" />
                      <p className="mt-4 text-lg font-medium">
                        {status === 'processing' ? LOADING_MESSAGES[loadingStep] : 'Suggesting your role...'}
                      </p>
                    </div>
                  ) : file ? (
                    <div className="text-center text-primary">
                      <FileText className="mx-auto h-12 w-12" />
                      <p className="mt-2 font-semibold">{file.name}</p>
                      <Button variant="link" size="sm" onClick={(e) => { e.stopPropagation(); handleReset(); }}>
                        Remove file
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <UploadCloud className="mx-auto h-12 w-12" />
                      <p className="mt-4 font-semibold">
                        Drag & Drop Your Document Here
                      </p>
                      <p className="text-sm">or click to browse</p>
                      <p className="mt-2 text-xs">PDF, DOCX, or TXT files only</p>
                    </div>
                  )}
                </div>
                
                {file && !isRoleSelectionDisabled && (
                    <div className="space-y-4">
                        <label className="text-sm font-medium">Confirm your role in this agreement:</label>
                        <RadioGroup value={selectedRoleOption} onValueChange={setSelectedRoleOption} disabled={isRoleSelectionDisabled}>
                            {suggestedRole && suggestedRole !== 'Other' && (
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value={suggestedRole} id={`role-${suggestedRole}`} />
                                    <Label htmlFor={`role-${suggestedRole}`}>{suggestedRole} (AI Suggestion)</Label>
                                </div>
                            )}
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="other" id="role-other" />
                                <Label htmlFor="role-other">Other</Label>
                            </div>
                        </RadioGroup>
                        {selectedRoleOption === 'other' && (
                            <Input 
                                placeholder="Please specify your role"
                                value={customRole}
                                onChange={(e) => setCustomRole(e.target.value)}
                                disabled={isRoleSelectionDisabled}
                            />
                        )}
                    </div>
                )}

                <Button
                  onClick={handleAnalysis}
                  disabled={!canAnalyze || isRoleSelectionDisabled}
                  className="w-full"
                  size="lg"
                >
                  {status === 'processing' ? 'Analyzing...' : 'Analyze Document'}
                </Button>
              </CardContent>
            </Card>
          )}
          
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Error</AlertTitle>
              <AlertDescription>
                {error} Please try again with a different file or contact support.
              </AlertDescription>
            </Alert>
          )}

          {status === 'success' && analysisResult && (
            <div className="space-y-8">
              <div className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                   <FileText className="h-8 w-8 text-primary" />
                   <div>
                     <p className="font-bold">{file?.name}</p>
                     <p className="text-sm text-muted-foreground">Role: {userRole}</p>
                   </div>
                </div>
                <Button onClick={handleReset} variant="outline">Analyze New Document</Button>
              </div>

              <RiskMeter
                riskScore={analysisResult.riskAssessment.riskScore}
                riskLevel={analysisResult.riskAssessment.riskLevel}
                summary={analysisResult.riskAssessment.summary}
              />
              <KeyNumbers keyNumbers={analysisResult.keyNumbers} />
              <ClauseBreakdown clauses={analysisResult.clauseBreakdown} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
