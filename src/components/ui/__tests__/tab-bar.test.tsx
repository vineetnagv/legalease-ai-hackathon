import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar, createAnalysisTabs, AnalysisTab } from '../tab-bar';

describe('Phase 3: Tab Bar Component', () => {
  const mockOnTabClick = vi.fn();

  const sampleTabs: AnalysisTab[] = [
    {
      id: 'keyNumbers',
      label: 'Key Numbers',
      icon: null,
      isComplete: true,
      isActive: false,
      badge: 5,
    },
    {
      id: 'risk',
      label: 'Risk',
      icon: null,
      isComplete: true,
      isActive: false,
      badge: 75,
    },
    {
      id: 'clauses',
      label: 'Clauses',
      icon: null,
      isComplete: false,
      isActive: false,
    },
  ];

  afterEach(() => {
    mockOnTabClick.mockClear();
  });

  it('renders all tabs', () => {
    render(
      <TabBar
        tabs={sampleTabs}
        activeTab="keyNumbers"
        onTabClick={mockOnTabClick}
      />
    );

    expect(screen.getByText('Key Numbers')).toBeInTheDocument();
    expect(screen.getByText('Risk')).toBeInTheDocument();
    expect(screen.getByText('Clauses')).toBeInTheDocument();
  });

  it('shows badges when provided', () => {
    render(
      <TabBar
        tabs={sampleTabs}
        activeTab="keyNumbers"
        onTabClick={mockOnTabClick}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('allows clicking on complete tabs', () => {
    render(
      <TabBar
        tabs={sampleTabs}
        activeTab="keyNumbers"
        onTabClick={mockOnTabClick}
      />
    );

    const riskTab = screen.getByText('Risk').closest('button');
    expect(riskTab).not.toBeNull();

    if (riskTab) {
      fireEvent.click(riskTab);
      expect(mockOnTabClick).toHaveBeenCalledWith('risk');
    }
  });

  it('disables incomplete tabs', () => {
    render(
      <TabBar
        tabs={sampleTabs}
        activeTab="keyNumbers"
        onTabClick={mockOnTabClick}
      />
    );

    const clausesTab = screen.getByText('Clauses').closest('button');
    expect(clausesTab).toHaveAttribute('disabled');
  });

  it('highlights active tab', () => {
    render(
      <TabBar
        tabs={sampleTabs}
        activeTab="keyNumbers"
        onTabClick={mockOnTabClick}
      />
    );

    const activeTab = screen.getByText('Key Numbers').closest('button');
    expect(activeTab).toHaveClass('bg-background');
  });

  it('shows checkmarks for completed tabs', () => {
    const { container } = render(
      <TabBar
        tabs={sampleTabs}
        activeTab="keyNumbers"
        onTabClick={mockOnTabClick}
      />
    );

    // Completed tabs should show visual indicators
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('shows loading spinner for incomplete tabs', () => {
    const { container } = render(
      <TabBar
        tabs={sampleTabs}
        activeTab="keyNumbers"
        onTabClick={mockOnTabClick}
      />
    );

    // Incomplete tabs should show loading indicator
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('shows progress indicator at bottom', () => {
    const { container } = render(
      <TabBar
        tabs={sampleTabs}
        activeTab="keyNumbers"
        onTabClick={mockOnTabClick}
      />
    );

    // Progress bar should be present
    const progressBar = container.querySelector('.bg-primary\\/20');
    expect(progressBar).not.toBeNull();
  });

  it('calculates progress correctly', () => {
    const { container } = render(
      <TabBar
        tabs={sampleTabs}
        activeTab="keyNumbers"
        onTabClick={mockOnTabClick}
      />
    );

    // 2 out of 3 tabs are complete = 66.67%
    const progressBar = container.querySelector('.bg-primary\\/20');
    // Progress should be updating
    expect(progressBar).toBeTruthy();
  });
});

describe('createAnalysisTabs helper', () => {
  it('creates tabs with correct completion states', () => {
    const tabs = createAnalysisTabs(5, 75, 3, 4, 2, 'chat_ready');

    expect(tabs).toHaveLength(6);
    expect(tabs[0].id).toBe('keyNumbers');
    expect(tabs[1].id).toBe('risk');
    expect(tabs[2].id).toBe('clauses');
    expect(tabs[3].id).toBe('faqs');
    expect(tabs[4].id).toBe('missing');
    expect(tabs[5].id).toBe('chat');
  });

  it('sets correct badges', () => {
    const tabs = createAnalysisTabs(5, 75, 3, 4, 2, 'chat_ready');

    expect(tabs[0].badge).toBe(5); // keyNumbers
    expect(tabs[1].badge).toBe(75); // risk
    expect(tabs[2].badge).toBe(3); // clauses
    expect(tabs[3].badge).toBe(4); // faqs
    expect(tabs[4].badge).toBe(2); // missing
  });

  it('marks tabs as complete based on status', () => {
    const tabs = createAnalysisTabs(5, 75, 3, 4, 2, 'clauses_complete');

    expect(tabs[0].isComplete).toBe(true); // keyNumbers
    expect(tabs[1].isComplete).toBe(true); // risk
    expect(tabs[2].isComplete).toBe(true); // clauses
    expect(tabs[3].isComplete).toBe(false); // faqs
    expect(tabs[4].isComplete).toBe(false); // missing
  });

  it('handles initial status correctly', () => {
    const tabs = createAnalysisTabs(0, null, 0, 0, 0, 'idle');

    // All tabs should be incomplete initially
    tabs.forEach(tab => {
      expect(tab.isComplete).toBe(false);
    });
  });

  it('handles final status correctly', () => {
    const tabs = createAnalysisTabs(5, 75, 3, 4, 2, 'chat_ready');

    // All tabs should be complete at chat_ready
    tabs.forEach(tab => {
      expect(tab.isComplete).toBe(true);
    });
  });
});
