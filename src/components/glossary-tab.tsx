
'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types/document-types';
import { glossary as generateGlossaryAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';

interface GlossaryTabProps {
  document: Document;
}

export function GlossaryTab({ document }: GlossaryTabProps) {
  const [glossary, setGlossary] = useState<{ term: string; definition: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateGlossary = async () => {
    setLoading(true);
    const result = await generateGlossaryAction(document.content);
    setGlossary(result.glossary);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <Button onClick={handleGenerateGlossary} disabled={loading}>{
        loading ? <LoaderCircle className="animate-spin" /> : 'Generate Glossary'
      }</Button>
      {glossary.length > 0 && (
        <div className="mt-4 space-y-4">
          {glossary.map((item, index) => (
            <div key={index}>
              <h3 className="font-bold">{item.term}</h3>
              <p>{item.definition}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
