
'use client';

import React, { useState, useCallback } from 'react';
import { DocumentViewer } from './document-viewer';
import { SmartPanel } from './smart-panel';
import { ChatPanel } from './panels/chat-panel';
import { NavigationTree } from './panels/navigation-tree';
import { Document } from '@/types/document-types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  List,
  Wrench
} from 'lucide-react';
import {
  PanelGroup,
  Panel,
  PanelResizeHandle
} from 'react-resizable-panels';

interface LegalNotebookProps {
  document: Document;
  onClose?: () => void;
}

export function LegalNotebook({ document, onClose }: LegalNotebookProps) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [highlightedSection, setHighlightedSection] = useState<string>('');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'navigation' | 'tools'>('navigation');

  const handleTextSelection = useCallback((text: string) => {
    setSelectedText(text);
  }, []);

  const handleSectionClick = useCallback((sectionId: string) => {
    setHighlightedSection(sectionId);
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Back Navigation */}
      <div className="border-b bg-muted/30 px-4 py-3 flex items-center gap-4">
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{document.title}</h1>
        </div>

        {/* Panel Toggle Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className="gap-2"
          >
            {leftPanelCollapsed ? (
              <>
                <PanelLeftOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Show Chat</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="hidden sm:inline">Hide Chat</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="gap-2"
          >
            {rightPanelCollapsed ? (
              <>
                <PanelRightOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Show Panel</span>
              </>
            ) : (
              <>
                <PanelRightClose className="h-4 w-4" />
                <span className="hidden sm:inline">Hide Panel</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main 3-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Chat */}
          {!leftPanelCollapsed && (
            <>
              <Panel
                defaultSize={25}
                minSize={20}
                maxSize={40}
                className="bg-background"
              >
                <ChatPanel document={document} />
              </Panel>
              <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
            </>
          )}

          {/* Middle Panel - Document Viewer */}
          <Panel
            defaultSize={leftPanelCollapsed && rightPanelCollapsed ? 100 : leftPanelCollapsed || rightPanelCollapsed ? 70 : 50}
            minSize={30}
            className="bg-background"
          >
            <DocumentViewer
              document={document}
              onTextSelect={handleTextSelection}
              highlightedSectionId={highlightedSection}
            />
          </Panel>

          {/* Right Panel - Navigation & Tools */}
          {!rightPanelCollapsed && (
            <>
              <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
              <Panel
                defaultSize={25}
                minSize={20}
                maxSize={40}
                className="bg-background"
              >
                <Tabs
                  value={rightPanelTab}
                  onValueChange={(value) => setRightPanelTab(value as 'navigation' | 'tools')}
                  className="h-full flex flex-col"
                >
                  <div className="border-b bg-muted/30">
                    <TabsList className="w-full grid grid-cols-2 h-12 bg-transparent p-1">
                      <TabsTrigger value="navigation" className="gap-2">
                        <List className="h-4 w-4" />
                        Navigation
                      </TabsTrigger>
                      <TabsTrigger value="tools" className="gap-2">
                        <Wrench className="h-4 w-4" />
                        Tools
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="navigation" className="flex-1 overflow-hidden m-0">
                    <NavigationTree
                      document={document}
                      onSectionClick={handleSectionClick}
                      onToolClick={() => setRightPanelTab('tools')}
                    />
                  </TabsContent>

                  <TabsContent value="tools" className="flex-1 overflow-hidden m-0">
                    <SmartPanel
                      document={document}
                      selectedText={selectedText}
                    />
                  </TabsContent>
                </Tabs>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  );
}
