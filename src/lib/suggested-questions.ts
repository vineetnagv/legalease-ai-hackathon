/**
 * @fileOverview Intelligent suggested questions generator based on document analysis context.
 */

import type {
  SuggestedQuestion,
  SuggestedQuestionGenerator,
  DocumentContext
} from '@/types/chat-types';
import type { DocumentType } from '@/types/document-types';

export class SuggestedQuestionsService {
  /**
   * Generates contextual questions based on document analysis results
   */
  static generateSuggestedQuestions(context: DocumentContext): SuggestedQuestion[] {
    const generator: SuggestedQuestionGenerator = {
      documentType: context.documentType,
      riskScore: context.riskScore,
      hasKeyNumbers: context.keyNumbers.length > 0,
      hasRiskyTerms: context.riskScore !== null && context.riskScore > 60,
      userRole: context.userRole
    };

    const questions: SuggestedQuestion[] = [];

    // Risk-based questions
    if (generator.riskScore !== null) {
      if (generator.riskScore > 70) {
        questions.push({
          id: 'high-risk-concern',
          text: `This document has a high risk score of ${generator.riskScore}. What should I be most concerned about?`,
          category: 'risk',
          priority: 10
        });
        questions.push({
          id: 'risk-mitigation',
          text: 'How can I protect myself from the risks identified in this document?',
          category: 'risk',
          priority: 9
        });
      } else if (generator.riskScore > 40) {
        questions.push({
          id: 'moderate-risk',
          text: 'What are the main risk factors I should be aware of?',
          category: 'risk',
          priority: 7
        });
      } else {
        questions.push({
          id: 'low-risk-confidence',
          text: 'Even though the risk is low, what should I still watch out for?',
          category: 'risk',
          priority: 5
        });
      }
    }

    // Document type-specific questions
    const typeSpecificQuestions = this.getDocumentTypeQuestions(generator);
    questions.push(...typeSpecificQuestions);

    // Key numbers questions
    if (generator.hasKeyNumbers) {
      questions.push({
        id: 'key-numbers-explanation',
        text: 'Can you explain what the key numbers and dates mean for me?',
        category: 'general',
        priority: 8
      });
    }

    // Clauses questions
    if (context.clauses.length > 0) {
      questions.push({
        id: 'complex-clauses',
        text: 'Which clauses are the most complex or important for me to understand?',
        category: 'clauses',
        priority: 8
      });

      // Find clauses with jargon
      const clausesWithJargon = context.clauses.filter(c => c.jargon.length > 0);
      if (clausesWithJargon.length > 0) {
        questions.push({
          id: 'jargon-explanation',
          text: 'Can you explain the legal jargon in simple terms?',
          category: 'clauses',
          priority: 6
        });
      }
    }

    // Negotiation questions
    if (generator.riskScore !== null && generator.riskScore > 30) {
      questions.push({
        id: 'negotiation-points',
        text: 'What terms should I try to negotiate before signing?',
        category: 'negotiation',
        priority: 9
      });
    }

    // Missing information questions
    questions.push({
      id: 'missing-protections',
      text: `As a ${generator.userRole}, what protections might be missing from this document?`,
      category: 'missing',
      priority: 7
    });

    // General practical questions
    questions.push({
      id: 'next-steps',
      text: 'What should I do next before making a decision about this document?',
      category: 'general',
      priority: 6
    });

    questions.push({
      id: 'professional-review',
      text: 'Do I need a lawyer to review this document?',
      category: 'general',
      priority: 5
    });

    // Sort by priority (highest first) and return top 10
    return questions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10);
  }

  /**
   * Gets document type-specific suggested questions
   */
  private static getDocumentTypeQuestions(generator: SuggestedQuestionGenerator): SuggestedQuestion[] {
    const questions: SuggestedQuestion[] = [];

    switch (generator.documentType) {
      case 'Lease':
        if (generator.userRole.toLowerCase().includes('tenant')) {
          questions.push(
            {
              id: 'lease-tenant-rights',
              text: 'What are my rights as a tenant under this lease?',
              category: 'general',
              priority: 9
            },
            {
              id: 'lease-early-termination',
              text: 'What happens if I need to move out early?',
              category: 'general',
              priority: 8
            },
            {
              id: 'lease-maintenance',
              text: 'Who is responsible for repairs and maintenance?',
              category: 'general',
              priority: 7
            }
          );
        } else {
          questions.push(
            {
              id: 'lease-landlord-protection',
              text: 'How am I protected if the tenant damages the property?',
              category: 'general',
              priority: 8
            },
            {
              id: 'lease-eviction',
              text: 'What are the procedures for eviction if needed?',
              category: 'general',
              priority: 7
            }
          );
        }
        break;

      case 'Employment':
        questions.push(
          {
            id: 'employment-termination',
            text: 'Under what conditions can my employment be terminated?',
            category: 'general',
            priority: 9
          },
          {
            id: 'employment-benefits',
            text: 'What benefits am I entitled to and when do they vest?',
            category: 'general',
            priority: 8
          },
          {
            id: 'employment-noncompete',
            text: 'Are there any restrictions on working for competitors after I leave?',
            category: 'general',
            priority: 7
          }
        );
        break;

      case 'LoanAgreement':
        questions.push(
          {
            id: 'loan-default',
            text: 'What happens if I miss payments or default on the loan?',
            category: 'risk',
            priority: 9
          },
          {
            id: 'loan-prepayment',
            text: 'Can I pay off the loan early and are there penalties?',
            category: 'general',
            priority: 8
          },
          {
            id: 'loan-interest',
            text: 'How is the interest calculated and can it change?',
            category: 'general',
            priority: 7
          }
        );
        break;

      case 'ServiceAgreement':
        questions.push(
          {
            id: 'service-scope',
            text: 'What exactly is included in the scope of work?',
            category: 'general',
            priority: 8
          },
          {
            id: 'service-changes',
            text: 'How are changes to the project scope handled?',
            category: 'general',
            priority: 7
          },
          {
            id: 'service-liability',
            text: 'What happens if something goes wrong with the service?',
            category: 'risk',
            priority: 7
          }
        );
        break;

      case 'NDA':
        questions.push(
          {
            id: 'nda-scope',
            text: 'What information is considered confidential under this NDA?',
            category: 'general',
            priority: 8
          },
          {
            id: 'nda-duration',
            text: 'How long do the confidentiality obligations last?',
            category: 'general',
            priority: 7
          },
          {
            id: 'nda-exceptions',
            text: 'What information can I still share publicly?',
            category: 'general',
            priority: 6
          }
        );
        break;

      case 'Purchase':
        questions.push(
          {
            id: 'purchase-warranty',
            text: 'What warranties are provided and what do they cover?',
            category: 'general',
            priority: 8
          },
          {
            id: 'purchase-inspection',
            text: 'Do I have the right to inspect before finalizing the purchase?',
            category: 'general',
            priority: 7
          },
          {
            id: 'purchase-cancellation',
            text: 'Can I cancel the purchase and under what conditions?',
            category: 'general',
            priority: 7
          }
        );
        break;

      default:
        questions.push(
          {
            id: 'general-obligations',
            text: 'What are my main obligations under this agreement?',
            category: 'general',
            priority: 7
          },
          {
            id: 'general-rights',
            text: 'What rights do I have under this agreement?',
            category: 'general',
            priority: 7
          }
        );
    }

    return questions;
  }

  /**
   * Gets follow-up questions based on recent chat context
   */
  static getFollowUpQuestions(
    lastUserMessage: string,
    documentContext: DocumentContext
  ): string[] {
    const message = lastUserMessage.toLowerCase();

    // Risk-related follow-ups
    if (message.includes('risk') || message.includes('danger') || message.includes('concern')) {
      return [
        'How can I reduce these risks?',
        'Should I get legal advice before proceeding?',
        'What would happen in the worst-case scenario?'
      ];
    }

    // Money/financial follow-ups
    if (message.includes('cost') || message.includes('pay') || message.includes('money') || message.includes('fee')) {
      return [
        'Are there any hidden costs I should know about?',
        'When are payments due?',
        'What happens if I can\'t make a payment?'
      ];
    }

    // Timeline/deadline follow-ups
    if (message.includes('when') || message.includes('deadline') || message.includes('time')) {
      return [
        'What happens if I miss a deadline?',
        'Can deadlines be extended?',
        'What are the most critical dates to remember?'
      ];
    }

    // Termination/cancellation follow-ups
    if (message.includes('terminate') || message.includes('cancel') || message.includes('end')) {
      return [
        'What are the penalties for early termination?',
        'How much notice do I need to give?',
        'Can the other party terminate the agreement?'
      ];
    }

    // Default contextual follow-ups
    return [
      'Can you give me more details about this?',
      'What should I do if I disagree with these terms?',
      'Are there industry standards I should compare this to?'
    ];
  }
}