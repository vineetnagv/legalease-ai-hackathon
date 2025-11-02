
'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Document } from '@/types/document-types';
import { SummaryTab } from './summary-tab';
import { GlossaryTab } from './glossary-tab';
import { DraftingTab } from './drafting-tab';
import { ExplanationTab } from './explanation-tab';
import { AnalysisTab } from './analysis-tab';

interface SmartPanelProps {
  document: Document;
  selectedText: string;
}

export function SmartPanel({ document, selectedText }: SmartPanelProps) {
  return (
    <Tabs defaultValue="analysis" className="h-full flex flex-col">
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="analysis">Analysis</TabsTrigger>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="glossary">Glossary</TabsTrigger>
        <TabsTrigger value="drafting">Drafting</TabsTrigger>
        <TabsTrigger value="explanation">Explain</TabsTrigger>
      </TabsList>
      <TabsContent value="analysis" className="flex-1 overflow-y-auto panel-scrollbar">
        <AnalysisTab document={document} />
      </TabsContent>
      <TabsContent value="summary" className="flex-1 overflow-y-auto panel-scrollbar">
        <SummaryTab document={document} />
      </TabsContent>
      <TabsContent value="glossary" className="flex-1 overflow-y-auto panel-scrollbar">
        <GlossaryTab document={document} />
      </TabsContent>
      <TabsContent value="drafting" className="flex-1 overflow-y-auto panel-scrollbar">
        <DraftingTab document={document} />
      </TabsContent>
      <TabsContent value="explanation" className="flex-1 overflow-y-auto panel-scrollbar">
        <ExplanationTab document={document} selectedText={selectedText} />
      </TabsContent>
    </Tabs>
  );
}
