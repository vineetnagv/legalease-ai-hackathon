'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Sparkles,
  Loader2,
  Download,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { generate } from '@/app/actions';
import { DocumentTemplates, type DocumentTemplate } from '@/types/document-generator-types';
import type { GenerateDocumentOutput } from '@/ai/flows/generate-document';
import ReactMarkdown from 'react-markdown';
import type { DocumentContext } from '@/types/chat-types';

interface DocumentGeneratorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentContext?: DocumentContext | null;
  className?: string;
}

type GenerationMode = 'template' | 'custom' | 'contextual';

export function DocumentGeneratorPanel({
  isOpen,
  onClose,
  documentContext,
  className
}: DocumentGeneratorPanelProps) {
  // State
  const [mode, setMode] = useState<GenerationMode>('template');
  const [templateType, setTemplateType] = useState<DocumentTemplate>('Non-Disclosure Agreement (NDA)');
  const [customPrompt, setCustomPrompt] = useState('');
  const [relatedDocumentType, setRelatedDocumentType] = useState('addendum');
  const [jurisdiction, setJurisdiction] = useState('United States');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Template inputs
  const [templateInputs, setTemplateInputs] = useState<Record<string, string>>({});

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<GenerateDocumentOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Handle template input change
  const handleTemplateInputChange = (key: string, value: string) => {
    setTemplateInputs(prev => ({ ...prev, [key]: value }));
  };

  // Get template-specific input fields
  const getTemplateFields = (template: DocumentTemplate): string[] => {
    const commonFields = ['Party 1 Name', 'Party 2 Name'];

    const templateSpecificFields: Record<string, string[]> = {
      'Non-Disclosure Agreement (NDA)': [...commonFields, 'Effective Date', 'Confidential Information Description'],
      'Employment Contract': [...commonFields, 'Position/Title', 'Start Date', 'Salary', 'Location'],
      'Service Agreement': [...commonFields, 'Service Description', 'Payment Terms', 'Start Date', 'Duration'],
      'Consulting Agreement': [...commonFields, 'Consulting Services', 'Fee Structure', 'Project Duration'],
      'Independent Contractor Agreement': [...commonFields, 'Project Description', 'Payment Schedule', 'Deliverables'],
      'Software License Agreement': ['Licensor Name', 'Licensee Name', 'Software Name', 'License Type', 'Fee'],
      'Partnership Agreement': ['Partner 1 Name', 'Partner 2 Name', 'Business Name', 'Capital Contributions', 'Profit Sharing %'],
      'Lease Agreement': ['Landlord Name', 'Tenant Name', 'Property Address', 'Monthly Rent', 'Lease Term', 'Security Deposit'],
      'Purchase Agreement': ['Seller Name', 'Buyer Name', 'Item/Property Description', 'Purchase Price', 'Closing Date'],
      'Terms of Service': ['Company Name', 'Website URL', 'Service Description', 'Effective Date'],
      'Privacy Policy': ['Company Name', 'Website URL', 'Data Collection Description', 'Effective Date'],
    };

    return templateSpecificFields[template] || commonFields;
  };

  // Handle generate document
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedDocument(null);

    try {
      let input: any = {
        mode,
        jurisdiction,
        additionalInstructions: additionalInstructions || undefined,
      };

      if (mode === 'template') {
        input.templateType = templateType;
        input.templateInputs = templateInputs;
      } else if (mode === 'custom') {
        if (!customPrompt.trim()) {
          throw new Error('Please provide a description of the document you want to generate.');
        }
        input.customPrompt = customPrompt;
      } else if (mode === 'contextual') {
        if (!documentContext) {
          throw new Error('No document context available. Please upload and analyze a document first.');
        }
        input.contextDocument = documentContext.documentText;
        input.contextAnalysis = {
          documentType: documentContext.documentType,
          keyNumbers: documentContext.keyNumbers,
          riskScore: documentContext.riskScore,
          riskSummary: documentContext.riskSummary,
          missingClauses: documentContext.clauses?.slice(0, 5).map(c => ({
            clauseTitle: c.clauseTitle,
            description: c.plainEnglish,
          })),
        };
        input.relatedDocumentType = relatedDocumentType;
      }

      const result = await generate(input);
      setGeneratedDocument(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate document');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!generatedDocument) return;

    try {
      await navigator.clipboard.writeText(generatedDocument.document);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!generatedDocument) return;

    const blob = new Blob([generatedDocument.document], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedDocument.metadata.suggestedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed right-0 top-0 h-full w-full sm:w-[600px] md:w-[700px] bg-background border-l shadow-2xl z-50 flex flex-col',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Document Generator</h2>
                  <p className="text-sm text-muted-foreground">Create legal documents with AI</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {!generatedDocument ? (
                  <>
                    {/* Mode Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Generation Mode</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup value={mode} onValueChange={(v) => setMode(v as GenerationMode)}>
                          <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                            <RadioGroupItem value="template" id="mode-template" />
                            <Label htmlFor="mode-template" className="flex-1 cursor-pointer">
                              <div className="font-medium">Template</div>
                              <div className="text-sm text-muted-foreground">Use pre-defined document templates</div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                            <RadioGroupItem value="custom" id="mode-custom" />
                            <Label htmlFor="mode-custom" className="flex-1 cursor-pointer">
                              <div className="font-medium">Custom</div>
                              <div className="text-sm text-muted-foreground">Describe what you need in your own words</div>
                            </Label>
                          </div>

                          {documentContext && (
                            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                              <RadioGroupItem value="contextual" id="mode-contextual" />
                              <Label htmlFor="mode-contextual" className="flex-1 cursor-pointer">
                                <div className="font-medium">Context-Aware</div>
                                <div className="text-sm text-muted-foreground">Generate based on your uploaded document</div>
                              </Label>
                            </div>
                          )}
                        </RadioGroup>
                      </CardContent>
                    </Card>

                    {/* Template Mode */}
                    {mode === 'template' && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Template Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Document Type</Label>
                            <Select value={templateType} onValueChange={(v) => setTemplateType(v as DocumentTemplate)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DocumentTemplates.filter(t => t !== 'Custom Document').map(template => (
                                  <SelectItem key={template} value={template}>{template}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {getTemplateFields(templateType).map(field => (
                            <div key={field}>
                              <Label>{field}</Label>
                              <Input
                                placeholder={`Enter ${field.toLowerCase()}`}
                                value={templateInputs[field] || ''}
                                onChange={(e) => handleTemplateInputChange(field, e.target.value)}
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Custom Mode */}
                    {mode === 'custom' && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Document Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Textarea
                            placeholder="Describe the document you need. For example: 'Create a consulting agreement between John Smith and Acme Corp for web development services, with a 3-month term and $5,000 monthly fee.'"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            rows={6}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Contextual Mode */}
                    {mode === 'contextual' && documentContext && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Related Document</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-3 bg-accent/50 rounded-lg">
                            <p className="text-sm font-medium mb-1">Current Document</p>
                            <p className="text-sm text-muted-foreground">{documentContext.documentType}</p>
                          </div>

                          <div>
                            <Label>Related Document Type</Label>
                            <Select value={relatedDocumentType} onValueChange={setRelatedDocumentType}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="addendum">Addendum</SelectItem>
                                <SelectItem value="amendment">Amendment</SelectItem>
                                <SelectItem value="counter-proposal">Counter-Proposal</SelectItem>
                                <SelectItem value="termination">Termination Notice</SelectItem>
                                <SelectItem value="renewal">Renewal Agreement</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Common Options */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Additional Options</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Jurisdiction</Label>
                          <Input
                            placeholder="e.g., California, USA"
                            value={jurisdiction}
                            onChange={(e) => setJurisdiction(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label>Additional Instructions (Optional)</Label>
                          <Textarea
                            placeholder="Any special requirements, clauses, or considerations..."
                            value={additionalInstructions}
                            onChange={(e) => setAdditionalInstructions(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Error Display */}
                    {error && (
                      <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                      </div>
                    )}

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Document...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Document
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Generated Document Display */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle className="text-base">Generated Document</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{generatedDocument.metadata.documentType}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleCopy}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 mb-4">
                          <Badge variant="secondary">{generatedDocument.metadata.wordCount} words</Badge>
                          <Badge variant="secondary">{generatedDocument.metadata.sections.length} sections</Badge>
                        </div>

                        <Separator className="my-4" />

                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{generatedDocument.document}</ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Summary Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{generatedDocument.summary}</p>
                      </CardContent>
                    </Card>

                    {/* Next Steps Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {generatedDocument.nextSteps.map((step, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="text-muted-foreground">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setGeneratedDocument(null)} className="flex-1">
                        Generate Another
                      </Button>
                      <Button onClick={onClose} className="flex-1">
                        Done
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
