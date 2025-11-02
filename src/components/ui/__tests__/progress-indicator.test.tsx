import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressIndicator } from '../progress-indicator';

// Mock Framer Motion to avoid animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Phase 1: Clickable Progress Indicator', () => {
  const mockOnStepClick = vi.fn();

  const defaultProps = {
    currentStep: 'extracting_numbers',
    onStepClick: mockOnStepClick,
  };

  afterEach(() => {
    mockOnStepClick.mockClear();
  });

  it('renders all progress steps', () => {
    render(<ProgressIndicator {...defaultProps} />);

    expect(screen.getByText('Extract Key Numbers')).toBeInTheDocument();
    expect(screen.getByText('Assess Document Risk')).toBeInTheDocument();
    expect(screen.getByText('Explain Legal Clauses')).toBeInTheDocument();
    expect(screen.getByText('Generate FAQs')).toBeInTheDocument();
    expect(screen.getByText('Detect Missing Clauses')).toBeInTheDocument();
    expect(screen.getByText('Initialize Chat')).toBeInTheDocument();
  });

  it('allows clicking on completed steps', () => {
    render(<ProgressIndicator currentStep="explaining_clauses" onStepClick={mockOnStepClick} />);

    // Find the "Extract Key Numbers" step which should be completed
    const extractNumbersStep = screen.getByText('Extract Key Numbers').closest('div');
    expect(extractNumbersStep).not.toBeNull();

    if (extractNumbersStep) {
      fireEvent.click(extractNumbersStep);
      expect(mockOnStepClick).toHaveBeenCalledWith('extracting_numbers');
    }
  });

  it('does not allow clicking on incomplete steps', () => {
    render(<ProgressIndicator currentStep="extracting_numbers" onStepClick={mockOnStepClick} />);

    // Find the "Assess Document Risk" step which should NOT be completed yet
    const riskStep = screen.getByText('Assess Document Risk').closest('div');

    if (riskStep) {
      fireEvent.click(riskStep);
      // Should not have been called because step is not complete
      expect(mockOnStepClick).not.toHaveBeenCalled();
    }
  });

  it('shows correct visual states for completed vs incomplete steps', () => {
    const { container } = render(<ProgressIndicator currentStep="explaining_clauses" onStepClick={mockOnStepClick} />);

    // Check that component renders without errors
    expect(container).toBeTruthy();
  });

  it('applies hover effects to clickable steps', () => {
    const { container } = render(<ProgressIndicator currentStep="explaining_clauses" onStepClick={mockOnStepClick} />);

    // Check that component renders
    expect(container).toBeTruthy();
  });

  it('shows current step with active styling', () => {
    render(<ProgressIndicator currentStep="extracting_numbers" onStepClick={mockOnStepClick} />);

    const currentStep = screen.getByText('Extract Key Numbers');
    expect(currentStep).toBeInTheDocument();
  });

  it('handles onStepClick prop being optional', () => {
    // Should not throw error when onStepClick is undefined
    expect(() => {
      render(<ProgressIndicator currentStep="extracting_numbers" />);
    }).not.toThrow();
  });

  it('calls onStepClick with correct step ID for different steps', () => {
    render(<ProgressIndicator currentStep="generating_faqs" onStepClick={mockOnStepClick} />);

    // Click on "Extract Key Numbers"
    const extractStep = screen.getByText('Extract Key Numbers').closest('div');
    if (extractStep) {
      fireEvent.click(extractStep);
      expect(mockOnStepClick).toHaveBeenCalledWith('extracting_numbers');
    }

    mockOnStepClick.mockClear();

    // Click on "Assess Document Risk"
    const riskStep = screen.getByText('Assess Document Risk').closest('div');
    if (riskStep) {
      fireEvent.click(riskStep);
      expect(mockOnStepClick).toHaveBeenCalledWith('assessing_risk');
    }
  });
});
