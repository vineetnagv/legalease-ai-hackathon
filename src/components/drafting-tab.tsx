
'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types/document-types';
import { redraft } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { LoaderCircle, SplitSquareHorizontal, FileText, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentReportExporter } from '@/lib/export-utils';
import { useToast } from '@/hooks/use-toast';

interface DraftingTabProps {
  document: Document;
}

export function DraftingTab({ document }: DraftingTabProps) {
  const [redraftedDocument, setRedraftedDocument] = useState('');
  const [summaryOfChanges, setSummaryOfChanges] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'diff' | 'redrafted'>('diff');
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleRedraft = async () => {
    setLoading(true);

    // Use analysis context if available for smarter redrafting
    const riskAnalysis = document.analysis?.riskScore && document.analysis?.riskSummary
      ? {
          riskScore: document.analysis.riskScore,
          riskSummary: document.analysis.riskSummary
        }
      : undefined;

    const result = await redraft(
      document.content,
      riskAnalysis,
      document.analysis?.missingClauses
    );
    setRedraftedDocument(result.redraftedDocument);
    setSummaryOfChanges(result.summaryOfChanges);
    setLoading(false);
  };

  const handleExportPDF = async () => {
    if (!redraftedDocument) return;

    setExporting(true);
    try {
      await DocumentReportExporter.exportRedraftToPDF({
        originalDocument: document.content,
        redraftedDocument,
        summaryOfChanges,
        documentTitle: document.title,
      });
      toast({
        title: 'PDF Exported',
        description: 'Redrafted document has been exported successfully.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export PDF. Please try again.',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex gap-2 mb-4">
        <Button onClick={handleRedraft} disabled={loading} className="flex gap-2">
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Redraft Document'}
        </Button>
        {redraftedDocument && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exporting}
              className="gap-2"
            >
              {exporting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {exporting ? 'Exporting...' : 'Export PDF'}
            </Button>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'diff' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('diff')}
                className="gap-2"
              >
                <SplitSquareHorizontal className="h-4 w-4" />
                Compare
              </Button>
              <Button
                variant={viewMode === 'redrafted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('redrafted')}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Redrafted
              </Button>
            </div>
          </div>
        )}
      </div>

      {redraftedDocument && (
        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Summary of Changes */}
          <div className="bg-accent/50 p-3 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Summary of Changes</h3>
            <p className="text-sm text-muted-foreground">{summaryOfChanges}</p>
          </div>

          {/* Document View */}
          {viewMode === 'diff' ? (
            <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
              {/* Original Document */}
              <div className="flex flex-col border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 border-b">
                  <h3 className="font-semibold text-sm">Original Document</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="prose prose-sm max-w-none text-xs">
                    <pre className="whitespace-pre-wrap font-sans">{document.content}</pre>
                  </div>
                </div>
              </div>

              {/* Redrafted Document */}
              <div className="flex flex-col border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 border-b">
                  <h3 className="font-semibold text-sm">Redrafted Document</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="prose prose-sm max-w-none text-xs">
                    <pre className="whitespace-pre-wrap font-sans">{redraftedDocument}</pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
              <div className="bg-muted px-3 py-2 border-b">
                <h3 className="font-semibold text-sm">Redrafted Document</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{redraftedDocument}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
