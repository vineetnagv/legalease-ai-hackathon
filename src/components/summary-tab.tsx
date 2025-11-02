
'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types/document-types';
import { summarize } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';

interface SummaryTabProps {
  document: Document;
}

export function SummaryTab({ document }: SummaryTabProps) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    const result = await summarize(document.content);
    setSummary(result.summary);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <Button onClick={handleSummarize} disabled={loading}>{
        loading ? <LoaderCircle className="animate-spin" /> : 'Generate Summary'
      }</Button>
      {summary && (
        <div className="mt-4 prose max-w-none">
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}
