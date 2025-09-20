
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import {
  ChevronDown,
  FileText,
  LoaderCircle,
  LogOut,
  UploadCloud,
  Settings,
} from 'lucide-react';
import { suggestRole } from '@/app/actions';
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
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { ThemeToggle } from './theme-toggle';
import { useLanguage } from '@/contexts/language-context';
import { LanguageSelector } from './language-selector';
import { useTranslation } from '@/lib/translations';

type Status =
  | 'idle'
  | 'suggesting_role'
  | 'ready'
  | 'error';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = useTranslation(language);

  const [status, setStatus] = useState<Status>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
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
          selectedFile.type.startsWith('text/')
        ) {
          setFile(selectedFile);
          setStatus('suggesting_role');
          setSuggestedRole('');
          setSelectedRoleOption('');
          setCustomRole('');
          try {
            const fileText = await selectedFile.text();
            
            // Client-side validation to prevent sending empty/null text
            if (!fileText || fileText.trim() === '') {
              toast({
                variant: 'destructive',
                title: t('role_suggestion_failed'),
                description: t('error_empty_document'),
              });
              setStatus('idle');
              setFile(null); // Clear the invalid file
              return;
            }

            const role = await suggestRole(fileText);
            setSuggestedRole(role);
            setSelectedRoleOption(role);
            setStatus('ready');
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            let errorTitle = t('role_suggestion_failed');
            let errorDescription = t('unexpected_error_occurred');

            if (error.message.includes('Document text is required')) {
              errorDescription = t('error_empty_document');
            } else if (error.message.includes('model not found')) {
              errorDescription = t('error_model_not_found');
            } else if (error.message.includes('API key')) {
              errorDescription = t('error_api_key');
            }
            
            toast({
              variant: 'destructive',
              title: errorTitle,
              description: errorDescription,
            });
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


  const handleReset = () => {
    setStatus('idle');
    setFile(null);
    setSuggestedRole('');
    setSelectedRoleOption('');
    setCustomRole('');
  };

  const isProcessing = status === 'suggesting_role';


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
                    accept=".txt"
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
                  onClick={() => alert("Analysis feature coming soon!")}
                  disabled={!canAnalyze || isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {t('analyze_document')}
                </Button>
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
