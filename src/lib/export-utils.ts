/**
 * @fileOverview Utilities for exporting document analysis reports as PDF and other formats.
 */

import jsPDF from 'jspdf';
import type { DocumentContext } from '@/types/chat-types';
import type { DetectMissingClausesOutput } from '@/ai/flows/detect-missing-clauses';

export interface ExportData {
  documentContext: DocumentContext;
  missingClauses?: DetectMissingClausesOutput;
  fileName?: string;
}

export class DocumentReportExporter {

  /**
   * Exports document analysis as a PDF report
   */
  static async exportToPDF(data: ExportData): Promise<void> {
    const { documentContext, missingClauses, fileName } = data;

    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10): number => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * (fontSize * 0.35)); // Approximate line height
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number): number => {
      if (yPosition + requiredSpace > 280) { // Near bottom of page
        pdf.addPage();
        return 20; // Reset to top of new page
      }
      return yPosition;
    };

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Legal Document Analysis Report', margin, yPosition);
    yPosition += 15;

    // Document Information
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Document Information', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(`Document Type: ${documentContext.documentType}`, margin, yPosition, contentWidth);
    yPosition = addWrappedText(`Confidence: ${documentContext.documentTypeConfidence}%`, margin, yPosition, contentWidth);
    yPosition = addWrappedText(`User Role: ${documentContext.userRole}`, margin, yPosition, contentWidth);
    yPosition = addWrappedText(`Analysis Date: ${new Date().toLocaleDateString()}`, margin, yPosition, contentWidth);
    yPosition += 10;

    // Risk Assessment
    yPosition = checkNewPage(30);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Risk Assessment', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    if (documentContext.riskScore !== null) {
      yPosition = addWrappedText(`Risk Score: ${documentContext.riskScore}/100`, margin, yPosition, contentWidth);
      yPosition = addWrappedText(`Risk Summary: ${documentContext.riskSummary}`, margin, yPosition, contentWidth);
    } else {
      yPosition = addWrappedText('Risk assessment not completed.', margin, yPosition, contentWidth);
    }
    yPosition += 10;

    // Key Numbers
    if (documentContext.keyNumbers.length > 0) {
      yPosition = checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Numbers & Dates', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      documentContext.keyNumbers.forEach((keyNumber) => {
        yPosition = checkNewPage(10);
        yPosition = addWrappedText(`• ${keyNumber.label}: ${keyNumber.value}`, margin, yPosition, contentWidth);
      });
      yPosition += 10;
    }

    // Explained Clauses
    if (documentContext.clauses.length > 0) {
      yPosition = checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Clause Explanations', margin, yPosition);
      yPosition += 8;

      documentContext.clauses.forEach((clause, index) => {
        yPosition = checkNewPage(40);

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText(`${index + 1}. ${clause.clauseTitle}`, margin, yPosition, contentWidth, 12);
        yPosition += 3;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(`Plain English: ${clause.plainEnglish}`, margin, yPosition, contentWidth, 9);

        if (clause.jargon.length > 0) {
          yPosition += 3;
          yPosition = addWrappedText('Legal Terms:', margin, yPosition, contentWidth, 9);
          clause.jargon.forEach((jargonItem) => {
            yPosition = checkNewPage(10);
            yPosition = addWrappedText(`  • ${jargonItem.term}: ${jargonItem.definition}`, margin, yPosition, contentWidth, 9);
          });
        }
        yPosition += 8;
      });
    }

    // Missing Clauses
    if (missingClauses && missingClauses.missingClauses.length > 0) {
      yPosition = checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Missing Clause Analysis', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(`Document Completeness: ${missingClauses.overallCompleteness}%`, margin, yPosition, contentWidth);
      yPosition = addWrappedText(`Summary: ${missingClauses.summary}`, margin, yPosition, contentWidth);
      yPosition += 5;

      missingClauses.missingClauses.forEach((clause, index) => {
        yPosition = checkNewPage(35);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText(`${index + 1}. ${clause.clauseTitle} (${clause.importance})`, margin, yPosition, contentWidth, 11);
        yPosition += 3;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(`Description: ${clause.description}`, margin, yPosition, contentWidth, 9);
        yPosition += 2;
        yPosition = addWrappedText(`Risk: ${clause.riskWithoutClause}`, margin, yPosition, contentWidth, 9);

        if (clause.suggestedLanguage) {
          yPosition += 2;
          yPosition = addWrappedText(`Suggested Language: "${clause.suggestedLanguage}"`, margin, yPosition, contentWidth, 9);
        }
        yPosition += 8;
      });
    }

    // FAQs
    if (documentContext.faqs.length > 0) {
      yPosition = checkNewPage(30);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Frequently Asked Questions', margin, yPosition);
      yPosition += 8;

      documentContext.faqs.forEach((faq, index) => {
        yPosition = checkNewPage(25);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText(`Q${index + 1}: ${faq.question}`, margin, yPosition, contentWidth, 10);
        yPosition += 3;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(`A: ${faq.answer}`, margin, yPosition, contentWidth, 9);
        yPosition += 8;
      });
    }

    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, 285);
      pdf.text('Generated by LegalEase', margin, 285);
    }

    // Save the PDF
    const defaultFileName = `${documentContext.documentType}_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName || defaultFileName);
  }

  /**
   * Generates a summary text for email sharing
   */
  static generateEmailSummary(data: ExportData): string {
    const { documentContext, missingClauses } = data;

    let summary = `Legal Document Analysis Summary\n\n`;
    summary += `Document Type: ${documentContext.documentType}\n`;
    summary += `User Role: ${documentContext.userRole}\n`;
    summary += `Analysis Date: ${new Date().toLocaleDateString()}\n\n`;

    // Risk Assessment
    if (documentContext.riskScore !== null) {
      summary += `RISK ASSESSMENT:\n`;
      summary += `Risk Score: ${documentContext.riskScore}/100\n`;
      summary += `${documentContext.riskSummary}\n\n`;
    }

    // Key Numbers
    if (documentContext.keyNumbers.length > 0) {
      summary += `KEY NUMBERS & DATES:\n`;
      documentContext.keyNumbers.forEach(kn => {
        summary += `• ${kn.label}: ${kn.value}\n`;
      });
      summary += '\n';
    }

    // Missing Clauses Summary
    if (missingClauses && missingClauses.missingClauses.length > 0) {
      summary += `MISSING CLAUSES:\n`;
      summary += `Document Completeness: ${missingClauses.overallCompleteness}%\n`;
      summary += `${missingClauses.summary}\n\n`;

      const criticalMissing = missingClauses.missingClauses.filter(c => c.importance === 'Critical');
      if (criticalMissing.length > 0) {
        summary += `Critical Missing Clauses:\n`;
        criticalMissing.forEach(clause => {
          summary += `• ${clause.clauseTitle}\n`;
        });
        summary += '\n';
      }
    }

    // Important Clauses
    if (documentContext.clauses.length > 0) {
      summary += `EXPLAINED CLAUSES:\n`;
      documentContext.clauses.slice(0, 3).forEach((clause, index) => {
        summary += `${index + 1}. ${clause.clauseTitle}\n`;
        summary += `   ${clause.plainEnglish}\n\n`;
      });
      if (documentContext.clauses.length > 3) {
        summary += `... and ${documentContext.clauses.length - 3} more clauses analyzed.\n\n`;
      }
    }

    summary += `For the complete analysis, please see the attached PDF report.\n\n`;
    summary += `Generated by LegalEase`;

    return summary;
  }

  /**
   * Creates a mailto link with pre-filled content
   */
  static createEmailLink(data: ExportData, recipientEmail?: string): string {
    const summary = this.generateEmailSummary(data);
    const subject = encodeURIComponent(`Legal Document Analysis - ${data.documentContext.documentType}`);
    const body = encodeURIComponent(summary);

    let mailtoLink = `mailto:${recipientEmail || ''}?subject=${subject}&body=${body}`;

    return mailtoLink;
  }

  /**
   * Copies analysis summary to clipboard
   */
  static async copyToClipboard(data: ExportData): Promise<boolean> {
    try {
      const summary = this.generateEmailSummary(data);
      await navigator.clipboard.writeText(summary);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Exports redrafted document comparison as PDF
   */
  static async exportRedraftToPDF(params: {
    originalDocument: string;
    redraftedDocument: string;
    summaryOfChanges: string;
    documentTitle?: string;
    fileName?: string;
  }): Promise<void> {
    const { originalDocument, redraftedDocument, summaryOfChanges, documentTitle, fileName } = params;

    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10): number => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * (fontSize * 0.35)); // Approximate line height
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number): number => {
      if (yPosition + requiredSpace > 280) { // Near bottom of page
        pdf.addPage();
        return 20; // Reset to top of new page
      }
      return yPosition;
    };

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(documentTitle || 'Document Redraft', margin, yPosition);
    yPosition += 10;

    // Date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;

    // Separator line
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Summary of Changes Section
    yPosition = checkNewPage(40);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary of Changes', margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addWrappedText(summaryOfChanges, margin, yPosition, contentWidth);
    yPosition += 10;

    // Separator line
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Original Document Section
    yPosition = checkNewPage(40);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Original Document', margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const originalLines = originalDocument.split('\n');
    for (const line of originalLines) {
      yPosition = checkNewPage(10);
      yPosition = addWrappedText(line || ' ', margin, yPosition, contentWidth, 9);
      yPosition += 2;
    }
    yPosition += 10;

    // New page for redrafted document
    pdf.addPage();
    yPosition = 20;

    // Redrafted Document Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Redrafted Document', margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const redraftedLines = redraftedDocument.split('\n');
    for (const line of redraftedLines) {
      yPosition = checkNewPage(10);
      yPosition = addWrappedText(line || ' ', margin, yPosition, contentWidth, 9);
      yPosition += 2;
    }

    // Add page numbers
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const defaultFileName = fileName || `${documentTitle?.replace(/[^a-z0-9]/gi, '_') || 'document'}_redraft_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(defaultFileName);
  }
}