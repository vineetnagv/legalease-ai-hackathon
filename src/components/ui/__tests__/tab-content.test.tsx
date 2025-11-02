import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TabContent } from '../tab-content';

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock ChatInterface
vi.mock('@/components/chat-interface', () => ({
  ChatInterface: ({ documentContext }: any) => (
    <div data-testid="chat-interface">Chat Interface - {documentContext?.documentType}</div>
  ),
}));

describe('Phase 3: Tab Content Component', () => {
  const mockOnToggleClause = vi.fn();
  const mockOnToggleFaq = vi.fn();
  const mockOnToggleMissingClause = vi.fn();
  const mockOnSendMessage = vi.fn(() => Promise.resolve({
    response: 'Test response',
    suggestedFollowUps: [],
  }));

  const defaultProps = {
    keyNumbers: [
      { label: 'Contract Value', value: '$100,000' },
      { label: 'Term', value: '2 years' },
    ],
    keyNumbersStatus: 'numbers_complete',
    riskScore: 75,
    riskSummary: 'High risk detected',
    riskStatus: 'risk_complete',
    clauses: [
      {
        clauseTitle: 'Payment Terms',
        originalText: 'Payment shall be made...',
        plainEnglish: 'You must pay within 30 days',
        jargon: [],
      },
    ],
    expandedClauses: new Set<number>(),
    onToggleClause: mockOnToggleClause,
    clausesStatus: 'clauses_complete',
    faqs: [
      {
        question: 'What is the notice period?',
        answer: '30 days notice required',
      },
    ],
    expandedFaqs: new Set<number>(),
    onToggleFaq: mockOnToggleFaq,
    faqsStatus: 'faqs_complete',
    missingClauses: {
      summary: 'Missing important clauses',
      missingClauses: [
        {
          clauseTitle: 'Termination Clause',
          description: 'Important for ending the contract',
          suggestedLanguage: 'Either party may terminate...',
        },
      ],
    },
    expandedMissingClauses: new Set<number>(),
    onToggleMissingClause: mockOnToggleMissingClause,
    missingStatus: 'missing_complete',
    documentContext: {
      documentText: 'Sample document',
      documentType: 'NDA',
      userRole: 'Employee',
    },
    onSendMessage: mockOnSendMessage,
  };

  afterEach(() => {
    mockOnToggleClause.mockClear();
    mockOnToggleFaq.mockClear();
    mockOnToggleMissingClause.mockClear();
    mockOnSendMessage.mockClear();
  });

  it('renders Key Numbers tab content', () => {
    render(<TabContent {...defaultProps} activeTab="keyNumbers" />);

    expect(screen.getByText('Key Numbers & Dates')).toBeInTheDocument();
    expect(screen.getByText('Contract Value')).toBeInTheDocument();
    expect(screen.getByText('$100,000')).toBeInTheDocument();
  });

  it('renders Risk tab content', () => {
    render(<TabContent {...defaultProps} activeTab="risk" />);

    expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument();
    expect(screen.getByText('High risk detected')).toBeInTheDocument();
  });

  it('renders Clauses tab content', () => {
    render(<TabContent {...defaultProps} activeTab="clauses" />);

    expect(screen.getByText('Clause Explanations')).toBeInTheDocument();
    expect(screen.getByText('Payment Terms')).toBeInTheDocument();
  });

  it('renders FAQs tab content', () => {
    render(<TabContent {...defaultProps} activeTab="faqs" />);

    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText('What is the notice period?')).toBeInTheDocument();
  });

  it('renders Missing Clauses tab content', () => {
    render(<TabContent {...defaultProps} activeTab="missing" />);

    expect(screen.getByText('Missing Clause Analysis')).toBeInTheDocument();
    expect(screen.getByText('Termination Clause')).toBeInTheDocument();
  });

  it('renders Chat tab content', () => {
    render(<TabContent {...defaultProps} activeTab="chat" />);

    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
  });

  it('shows loading indicator for Key Numbers', () => {
    render(
      <TabContent
        {...defaultProps}
        activeTab="keyNumbers"
        keyNumbersStatus="extracting_numbers"
      />
    );

    expect(screen.getByText('Extracting key numbers and dates...')).toBeInTheDocument();
  });

  it('shows loading indicator for Risk', () => {
    render(
      <TabContent
        {...defaultProps}
        activeTab="risk"
        riskStatus="assessing_risk"
      />
    );

    expect(screen.getByText('Analyzing document risks...')).toBeInTheDocument();
  });

  it('shows loading indicator for Clauses', () => {
    render(
      <TabContent
        {...defaultProps}
        activeTab="clauses"
        clausesStatus="explaining_clauses"
      />
    );

    expect(screen.getByText('Explaining legal clauses...')).toBeInTheDocument();
  });

  it('shows loading indicator for FAQs', () => {
    render(
      <TabContent
        {...defaultProps}
        activeTab="faqs"
        faqsStatus="generating_faqs"
      />
    );

    expect(screen.getByText('Generating FAQs...')).toBeInTheDocument();
  });

  it('shows loading indicator for Missing Clauses', () => {
    render(
      <TabContent
        {...defaultProps}
        activeTab="missing"
        missingStatus="detecting_missing"
      />
    );

    expect(screen.getByText('Detecting missing clauses...')).toBeInTheDocument();
  });

  it('shows empty state when no key numbers found', () => {
    render(
      <TabContent
        {...defaultProps}
        activeTab="keyNumbers"
        keyNumbers={[]}
      />
    );

    expect(screen.getByText('No key numbers or dates found in this document.')).toBeInTheDocument();
  });

  it('shows empty state when no clauses found', () => {
    render(
      <TabContent
        {...defaultProps}
        activeTab="clauses"
        clauses={[]}
      />
    );

    expect(screen.getByText('No clauses to explain.')).toBeInTheDocument();
  });

  it('shows empty state when no FAQs', () => {
    render(
      <TabContent
        {...defaultProps}
        activeTab="faqs"
        faqs={[]}
      />
    );

    expect(screen.getByText('No FAQs available.')).toBeInTheDocument();
  });

  it('shows risk level with correct color for low risk', () => {
    const { container } = render(
      <TabContent
        {...defaultProps}
        activeTab="risk"
        riskScore={25}
      />
    );

    const progressBar = container.querySelector('.bg-green-500');
    expect(progressBar).toBeTruthy();
  });

  it('shows risk level with correct color for medium risk', () => {
    const { container } = render(
      <TabContent
        {...defaultProps}
        activeTab="risk"
        riskScore={50}
      />
    );

    const progressBar = container.querySelector('.bg-yellow-500');
    expect(progressBar).toBeTruthy();
  });

  it('shows risk level with correct color for high risk', () => {
    const { container } = render(
      <TabContent
        {...defaultProps}
        activeTab="risk"
        riskScore={85}
      />
    );

    const progressBar = container.querySelector('.bg-red-500');
    expect(progressBar).toBeTruthy();
  });

  it('displays calendar button for date key numbers', () => {
    const propsWithDate = {
      ...defaultProps,
      keyNumbers: [
        { label: 'Lease Start Date', value: 'January 15, 2025' },
      ],
    };

    render(<TabContent {...propsWithDate} activeTab="keyNumbers" />);

    expect(screen.getByText('Add to Google Calendar')).toBeInTheDocument();
  });

  it('shows chat unavailable message when no documentContext', () => {
    render(
      <TabContent
        {...defaultProps}
        activeTab="chat"
        documentContext={null}
      />
    );

    expect(screen.getByText('Chat will be available once analysis is complete.')).toBeInTheDocument();
  });

  it('handles missing clauses with no missing items', () => {
    render(
      <TabContent
        {...defaultProps}
        activeTab="missing"
        missingClauses={{
          summary: 'Document is comprehensive',
          missingClauses: [],
        }}
      />
    );

    expect(screen.getByText('No missing clauses detected. This document appears comprehensive.')).toBeInTheDocument();
  });
});
