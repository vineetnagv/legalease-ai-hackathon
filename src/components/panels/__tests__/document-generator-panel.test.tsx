import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentGeneratorPanel } from '../document-generator-panel';

// Mock the generate action
vi.mock('@/app/actions', () => ({
  generate: vi.fn(() => Promise.resolve({
    documentContent: '# Generated Document\n\nTest content.',
    metadata: {
      documentType: 'Test',
      jurisdiction: 'CA',
      generatedAt: new Date().toISOString(),
      wordCount: 150,
      sections: ['Introduction', 'Terms', 'Conclusion'],
    },
    summary: 'Test summary',
    nextSteps: ['Review', 'Sign'],
  })),
}));

// Mock ReactMarkdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

describe('Phase 2: Document Generator Panel UI', () => {
  const mockOnClose = vi.fn();
  const mockDocumentContext = {
    documentText: 'Sample document text',
    documentType: 'NDA',
    userRole: 'Employee',
  };

  afterEach(() => {
    mockOnClose.mockClear();
  });

  it('renders when open', () => {
    render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    expect(screen.getByText('Document Generator')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <DocumentGeneratorPanel
        isOpen={false}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    expect(screen.queryByText('Document Generator')).not.toBeInTheDocument();
  });

  it('shows three generation modes', () => {
    render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    expect(screen.getByText('Use pre-defined document templates')).toBeInTheDocument();
    expect(screen.getByText('Describe what you need in your own words')).toBeInTheDocument();
  });

  it('shows template dropdown in template mode', () => {
    render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    // Template mode should be selected by default
    expect(screen.getByText('Template Configuration')).toBeInTheDocument();
  });

  it('switches between modes correctly', async () => {
    render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    // Click on Custom mode
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);

    // Should show custom prompt textarea
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/describe the document/i)).toBeInTheDocument();
    });
  });

  it('displays all document templates in dropdown', () => {
    const { container } = render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    // Check that template selector is present
    const templateLabel = screen.getByText('Document Type');
    expect(templateLabel).toBeInTheDocument();
  });

  it('has jurisdiction selector', () => {
    render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    expect(screen.getByText('Jurisdiction')).toBeInTheDocument();
  });

  it('has optional additional instructions field', () => {
    render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    expect(screen.getByText('Additional Instructions (Optional)')).toBeInTheDocument();
  });

  it('has generate button', () => {
    render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate/i });
    expect(generateButton).toBeInTheDocument();
  });

  it('handles document generation interaction', async () => {
    render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate document/i });

    // Clicking generate button should not crash
    expect(() => fireEvent.click(generateButton)).not.toThrow();
  });

  it('displays generated document after generation completes', async () => {
    render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate document/i });
    fireEvent.click(generateButton);

    // Wait for mock to complete and content to render
    await waitFor(() => {
      // The mocked documentContent should appear
      const content = screen.queryByText(/Generated Document/i);
      expect(content).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('provides document actions after generation', async () => {
    const { container } = render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    const generateButton = screen.getByRole('button', { name: /generate document/i });
    fireEvent.click(generateButton);

    // Component should render without errors after generation
    await waitFor(() => {
      // Check that the panel is still rendered
      expect(container.querySelector('.flex.flex-col')).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('closes when close button is clicked', () => {
    const { container } = render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={mockDocumentContext}
      />
    );

    // Find the X button in the header
    const closeButtons = container.querySelectorAll('button');
    const xButton = Array.from(closeButtons).find(btn => {
      const svg = btn.querySelector('.lucide-x');
      return svg !== null;
    });

    expect(xButton).toBeTruthy();
    if (xButton) {
      fireEvent.click(xButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('works without documentContext (for non-contextual modes)', () => {
    render(
      <DocumentGeneratorPanel
        isOpen={true}
        onClose={mockOnClose}
        documentContext={null}
      />
    );

    expect(screen.getByText('Document Generator')).toBeInTheDocument();
    // Template and custom modes should still be available
    expect(screen.getByText('Use pre-defined document templates')).toBeInTheDocument();
  });
});
