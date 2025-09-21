'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileQuestion,
  X,
  Upload,
  File,
  Check,
  AlertTriangle,
  ArrowRight,
  FileText,
  BarChart3,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DocumentContext } from '@/types/chat-types';

interface DocumentComparisonPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocument: DocumentContext;
  className?: string;
}

interface ComparisonDocument {
  name: string;
  type: string;
  size: number;
  text: string;
  documentType: string;
  riskScore?: number;
  keyNumbers: Array<{ label: string; value: string }>;
  clauses: Array<{ clauseTitle: string; plainEnglish: string }>;
}

export function DocumentComparisonPanel({
  isOpen,
  onClose,
  currentDocument,
  className
}: DocumentComparisonPanelProps) {
  const [comparisonDoc, setComparisonDoc] = useState<ComparisonDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Upload and parse the document
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse document');
      }

      const result = await response.json();

      // Create comparison document object
      const newComparisonDoc: ComparisonDocument = {
        name: file.name,
        type: result.metadata.fileType,
        size: file.size,
        text: result.text,
        documentType: 'Analyzing...', // Would be set by document type detection
        keyNumbers: [], // Would be extracted
        clauses: [] // Would be extracted
      };

      setComparisonDoc(newComparisonDoc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Simulate file input change
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  const clearComparison = () => {
    setComparisonDoc(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 h-full w-full max-w-4xl bg-background border-l shadow-lg z-50',
              className
            )}
          >
            <Card className="h-full rounded-none border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileQuestion className="h-5 w-5" />
                    Document Comparison
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-4 pb-4">
                <ScrollArea className="h-full">
                  {!comparisonDoc ? (
                    // Upload Area
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">Compare Documents</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Upload a second document to compare with your current document analysis
                        </p>
                      </div>

                      {/* Current Document Summary */}
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Current Document
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <span className="ml-2 font-medium">{currentDocument.documentType}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Risk Score:</span>
                            <span className="ml-2 font-medium">
                              {currentDocument.riskScore !== null ? `${currentDocument.riskScore}/100` : 'Not assessed'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Key Numbers:</span>
                            <span className="ml-2 font-medium">{currentDocument.keyNumbers.length}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Explained Clauses:</span>
                            <span className="ml-2 font-medium">{currentDocument.clauses.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Upload Area */}
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                          "hover:border-primary/50 hover:bg-muted/30",
                          isUploading && "border-primary bg-primary/5"
                        )}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        <div className="space-y-4">
                          {isUploading ? (
                            <>
                              <div className="animate-spin mx-auto h-8 w-8 text-primary">
                                <Upload className="h-8 w-8" />
                              </div>
                              <p className="text-sm font-medium">Processing document...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium mb-1">
                                  Drag and drop a document here, or click to browse
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Supports PDF, DOCX, and TXT files (max 10MB)
                                </p>
                              </div>
                              <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                disabled={isUploading}
                              >
                                Choose File
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Upload Error</span>
                          </div>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    // Comparison View
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Document Comparison</h3>
                        <Button variant="outline" onClick={clearComparison}>
                          Compare Different Document
                        </Button>
                      </div>

                      {/* Document Headers */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <h4 className="font-medium flex items-center gap-2">
                            <File className="h-4 w-4" />
                            Current Document
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            <p>Type: {currentDocument.documentType}</p>
                            <p>User Role: {currentDocument.userRole}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium flex items-center gap-2">
                            <File className="h-4 w-4" />
                            {comparisonDoc.name}
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            <p>Size: {formatFileSize(comparisonDoc.size)}</p>
                            <p>Type: {comparisonDoc.type}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Basic Comparison */}
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Basic Comparison
                        </h4>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Document Length:</span>
                              <span className="font-medium">{currentDocument.documentText?.length.toLocaleString() || 'N/A'} chars</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Risk Score:</span>
                              <Badge variant={
                                currentDocument.riskScore !== null && currentDocument.riskScore > 70 ? 'destructive' :
                                currentDocument.riskScore !== null && currentDocument.riskScore > 40 ? 'secondary' : 'default'
                              }>
                                {currentDocument.riskScore !== null ? `${currentDocument.riskScore}/100` : 'Not assessed'}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Key Numbers:</span>
                              <span className="font-medium">{currentDocument.keyNumbers.length}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Document Length:</span>
                              <span className="font-medium">{comparisonDoc.text.length.toLocaleString()} chars</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Risk Score:</span>
                              <Badge variant="outline">
                                Not analyzed
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Key Numbers:</span>
                              <span className="font-medium">Not extracted</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Content Preview */}
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Content Preview
                        </h4>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h5 className="text-sm font-medium mb-2">Current Document</h5>
                            <div className="bg-muted/30 rounded p-3 text-xs font-mono max-h-32 overflow-y-auto">
                              {currentDocument.documentText?.substring(0, 300) || 'No content available'}
                              {(currentDocument.documentText?.length || 0) > 300 && '...'}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium mb-2">Comparison Document</h5>
                            <div className="bg-muted/30 rounded p-3 text-xs font-mono max-h-32 overflow-y-auto">
                              {comparisonDoc.text.substring(0, 300)}
                              {comparisonDoc.text.length > 300 && '...'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Analysis Recommendations */}
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Comparison Analysis
                        </h4>

                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                Comparison Available
                              </p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                The second document has been uploaded successfully. To perform a detailed comparison including
                                risk assessment, clause analysis, and key differences, you would need to run the full analysis
                                on the comparison document.
                              </p>
                              <div className="pt-2">
                                <Button size="sm" variant="outline" disabled>
                                  Run Full Analysis (Coming Soon)
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}