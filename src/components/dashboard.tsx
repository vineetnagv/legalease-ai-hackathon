// @ts-nocheck
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
} from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { analyzeDocument } from '@/app/actions';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import RiskMeter from './risk-meter';
import KeyNumbers from './key-numbers';
import ClauseBreakdown from './clause-breakdown';

type Status = 'idle' | 'processing' | 'success' | 'error';

const ROLES = [
  'Tenant',
  'Landlord',
  'Employee',
  'Employer',
  'Freelancer',
  'Client',
];

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
  const [role, setRole] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [error, setError] = useState<string>('');
  const [loadingStep, setLoadingStep] = useState(0);

  const canAnalyze = useMemo(() => file && role, [file, role]);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || selectedFile.type.startsWith('text/')) {
        setFile(selectedFile);
        setStatus('idle');
      } else {
        toast({
          variant: 'destructive',
          title: 'Unsupported File Type',
          description: 'Please upload a PDF, DOCX, or a plain text file.',
        });
      }
    }
  };

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
      const result = await analyzeDocument(fileText, role);
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
    setRole('');
    setAnalysisResult(null);
    setError('');
  };

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
              Upload your document, tell us your role, and get instant insights.
            </p>
          </div>

          {status !== 'success' && (
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">I am the:</label>
                    <Select value={role} onValueChange={setRole} disabled={status === 'processing'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                    disabled={status === 'processing'}
                  />
                  {status === 'processing' ? (
                    <div className="text-center">
                      <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-primary" />
                      <p className="mt-4 text-lg font-medium">{LOADING_MESSAGES[loadingStep]}</p>
                    </div>
                  ) : file ? (
                    <div className="text-center text-primary">
                      <FileText className="mx-auto h-12 w-12" />
                      <p className="mt-2 font-semibold">{file.name}</p>
                      <Button variant="link" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
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

                <Button
                  onClick={handleAnalysis}
                  disabled={!canAnalyze || status === 'processing'}
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
                     <p className="text-sm text-muted-foreground">Role: {role}</p>
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
