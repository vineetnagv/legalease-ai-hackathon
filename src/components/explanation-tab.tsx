
'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types/document-types';
import { explainDocumentClauses } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';

interface ExplanationTabProps {
  document: Document;
  selectedText: string;
}

export function ExplanationTab({ document, selectedText }: ExplanationTabProps) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    if (!selectedText) return;
    setLoading(true);
    const result = await explainDocumentClauses(selectedText, 'user');
    // Assuming the flow returns a single explanation for the selected text
    setExplanation(result.clauses[0]?.plainEnglish || 'Could not explain the selected text.');
    setLoading(false);
  };

  useEffect(() => {
    if (selectedText) {
      handleExplain();
    }
  }, [selectedText]);

  return (
    <div className="p-4">
      <p className="text-sm text-muted-foreground">Select text in the document to see an explanation here.</p>
      {loading && <LoaderCircle className="animate-spin" />}
      {explanation && (
        <div className="mt-4 prose max-w-none">
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}
