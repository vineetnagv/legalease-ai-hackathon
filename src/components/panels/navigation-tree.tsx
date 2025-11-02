'use client';

import React, { useState } from 'react';
import { Document } from '@/types/document-types';
import { ChevronRight, ChevronDown, FileText, Hash, AlertTriangle, HelpCircle, Search, MessageSquare, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TreeNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  children?: TreeNode[];
  onClick?: () => void;
}

interface NavigationTreeProps {
  document: Document;
  onSectionClick?: (sectionId: string) => void;
  onToolClick?: () => void;
}

export function NavigationTree({ document, onSectionClick, onToolClick }: NavigationTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['analysis', 'tools']));

  const toggleNode = (nodeId: string) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    setExpandedNodes(newSet);
  };

  const handleNodeClick = (node: TreeNode) => {
    if (node.children && node.children.length > 0) {
      toggleNode(node.id);
    } else if (node.onClick) {
      node.onClick();
    } else if (onSectionClick) {
      onSectionClick(node.id);
    }
  };

  // Build tree structure from document analysis
  const buildTree = (): TreeNode[] => {
    const tree: TreeNode[] = [];

    // Document Overview
    tree.push({
      id: 'document',
      label: 'Document',
      icon: <FileText className="h-4 w-4" />,
      children: [
        {
          id: 'doc-info',
          label: 'Information',
          icon: <FileText className="h-4 w-4" />,
        },
        {
          id: 'doc-content',
          label: 'Full Text',
          icon: <BookOpen className="h-4 w-4" />,
        },
      ],
    });

    // Analysis Section
    if (document.analysis) {
      const analysisChildren: TreeNode[] = [];

      if (document.analysis.keyNumbers && document.analysis.keyNumbers.length > 0) {
        analysisChildren.push({
          id: 'key-numbers',
          label: 'Key Numbers',
          icon: <Hash className="h-4 w-4" />,
          badge: document.analysis.keyNumbers.length,
        });
      }

      if (document.analysis.riskScore !== undefined) {
        analysisChildren.push({
          id: 'risk-assessment',
          label: 'Risk Assessment',
          icon: <AlertTriangle className="h-4 w-4" />,
          badge: document.analysis.riskScore,
        });
      }

      if (document.analysis.clauses && document.analysis.clauses.length > 0) {
        analysisChildren.push({
          id: 'clauses',
          label: 'Explained Clauses',
          icon: <FileText className="h-4 w-4" />,
          badge: document.analysis.clauses.length,
        });
      }

      if (document.analysis.faqs && document.analysis.faqs.length > 0) {
        analysisChildren.push({
          id: 'faqs',
          label: 'FAQs',
          icon: <HelpCircle className="h-4 w-4" />,
          badge: document.analysis.faqs.length,
        });
      }

      if (document.analysis.missingClauses?.missingClauses && document.analysis.missingClauses.missingClauses.length > 0) {
        analysisChildren.push({
          id: 'missing-clauses',
          label: 'Missing Clauses',
          icon: <Search className="h-4 w-4" />,
          badge: document.analysis.missingClauses.missingClauses.length,
        });
      }

      if (analysisChildren.length > 0) {
        tree.push({
          id: 'analysis',
          label: 'Analysis',
          icon: <AlertTriangle className="h-4 w-4" />,
          children: analysisChildren,
        });
      }
    }

    // Tools Section
    tree.push({
      id: 'tools',
      label: 'Tools',
      icon: <MessageSquare className="h-4 w-4" />,
      children: [
        {
          id: 'tool-summary',
          label: 'Summarize',
          icon: <FileText className="h-4 w-4" />,
          onClick: onToolClick,
        },
        {
          id: 'tool-glossary',
          label: 'Glossary',
          icon: <BookOpen className="h-4 w-4" />,
          onClick: onToolClick,
        },
        {
          id: 'tool-redraft',
          label: 'Redraft',
          icon: <FileText className="h-4 w-4" />,
          onClick: onToolClick,
        },
      ],
    });

    return tree;
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <button
          onClick={() => handleNodeClick(node)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors',
            level === 0 && 'font-medium'
          )}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          {hasChildren && (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
            </>
          )}
          {!hasChildren && <div className="w-4" />}

          <div className="flex-shrink-0">{node.icon}</div>

          <span className="flex-1 text-left truncate">{node.label}</span>

          {node.badge !== undefined && (
            <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 h-5">
              {node.badge}
            </Badge>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-2 bg-muted/30">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">Navigation</h2>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto p-2 panel-scrollbar">
        {tree.map(node => renderTreeNode(node))}
      </div>

      {/* Footer Info */}
      <div className="border-t p-4 text-xs text-muted-foreground">
        <div className="space-y-1">
          {document.documentType && (
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="font-medium">{document.documentType}</span>
            </div>
          )}
          {document.userRole && (
            <div className="flex justify-between">
              <span>Role:</span>
              <span className="font-medium">{document.userRole}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
