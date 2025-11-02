import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserPreferencesService } from '../user-preferences';

describe('Phase 3: User Preferences - Analysis View Mode', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('defaults to scroll view mode', () => {
    const prefs = UserPreferencesService.loadPreferences();
    expect(prefs.ui.analysisViewMode).toBe('scroll');
  });

  it('allows setting tab view mode', () => {
    UserPreferencesService.setPreference('ui', 'analysisViewMode', 'tabs');

    const prefs = UserPreferencesService.loadPreferences();
    expect(prefs.ui.analysisViewMode).toBe('tabs');
  });

  it('allows switching between scroll and tab views', () => {
    // Start with scroll view
    UserPreferencesService.setPreference('ui', 'analysisViewMode', 'scroll');
    let prefs = UserPreferencesService.loadPreferences();
    expect(prefs.ui.analysisViewMode).toBe('scroll');

    // Switch to tab view
    UserPreferencesService.setPreference('ui', 'analysisViewMode', 'tabs');
    prefs = UserPreferencesService.loadPreferences();
    expect(prefs.ui.analysisViewMode).toBe('tabs');

    // Switch back to scroll view
    UserPreferencesService.setPreference('ui', 'analysisViewMode', 'scroll');
    prefs = UserPreferencesService.loadPreferences();
    expect(prefs.ui.analysisViewMode).toBe('scroll');
  });

  it('persists view mode to localStorage', () => {
    UserPreferencesService.setPreference('ui', 'analysisViewMode', 'tabs');

    // Reload preferences from localStorage
    const prefs = UserPreferencesService.loadPreferences();
    expect(prefs.ui.analysisViewMode).toBe('tabs');
  });

  it('updates multiple UI preferences together', () => {
    UserPreferencesService.updatePreferences('ui', {
      analysisViewMode: 'tabs',
      theme: 'dark',
      compactMode: true,
    });

    const prefs = UserPreferencesService.loadPreferences();
    expect(prefs.ui.analysisViewMode).toBe('tabs');
    expect(prefs.ui.theme).toBe('dark');
    expect(prefs.ui.compactMode).toBe(true);
  });

  it('maintains other UI settings when changing view mode', () => {
    // Set initial preferences
    UserPreferencesService.updatePreferences('ui', {
      theme: 'dark',
      language: 'en',
      showAnimations: true,
      compactMode: false,
      dockPosition: 'right',
      analysisViewMode: 'scroll',
    });

    // Change only view mode
    UserPreferencesService.setPreference('ui', 'analysisViewMode', 'tabs');

    const prefs = UserPreferencesService.loadPreferences();
    // View mode should be updated
    expect(prefs.ui.analysisViewMode).toBe('tabs');
    // Other settings should remain unchanged
    expect(prefs.ui.theme).toBe('dark');
    expect(prefs.ui.language).toBe('en');
    expect(prefs.ui.showAnimations).toBe(true);
    expect(prefs.ui.dockPosition).toBe('right');
  });

  it('resets view mode to default when resetting all preferences', () => {
    // Set to tabs
    UserPreferencesService.setPreference('ui', 'analysisViewMode', 'tabs');
    expect(UserPreferencesService.loadPreferences().ui.analysisViewMode).toBe('tabs');

    // Reset all preferences
    const resetPrefs = UserPreferencesService.resetToDefaults();
    expect(resetPrefs.ui.analysisViewMode).toBe('scroll');
  });

  it('exports preferences including view mode', () => {
    UserPreferencesService.setPreference('ui', 'analysisViewMode', 'tabs');
    const exported = UserPreferencesService.exportPreferences();

    const parsed = JSON.parse(exported);
    expect(parsed.ui.analysisViewMode).toBe('tabs');
  });

  it('imports preferences with view mode', () => {
    const importData = {
      ui: {
        theme: 'dark',
        language: 'en',
        showAnimations: true,
        compactMode: false,
        dockPosition: 'right',
        analysisViewMode: 'tabs',
      },
      chatSettings: {
        saveChatHistory: true,
        autoSuggestQuestions: true,
        voiceEnabled: true,
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reducedMotion: false,
        screenReaderOptimized: false,
      },
      analysis: {
        autoStartAnalysis: false,
        showDetailedExplanations: true,
        exportFormat: 'pdf',
        includeVoiceInExports: false,
      },
      privacy: {
        analyticsOptIn: false,
        errorReportingOptIn: true,
        documentRetention: '30days',
      },
    };

    const success = UserPreferencesService.importPreferences(JSON.stringify(importData));
    expect(success).toBe(true);

    const prefs = UserPreferencesService.loadPreferences();
    expect(prefs.ui.analysisViewMode).toBe('tabs');
  });

  it('merges with defaults when loading old preferences without view mode', () => {
    // Simulate old preferences without analysisViewMode
    const oldPrefs = {
      ui: {
        theme: 'dark',
        language: 'en',
        showAnimations: true,
        compactMode: false,
        dockPosition: 'right',
      },
    };

    localStorage.setItem('legalmind_user_preferences', JSON.stringify(oldPrefs));

    const prefs = UserPreferencesService.loadPreferences();
    // Should have default view mode
    expect(prefs.ui.analysisViewMode).toBe('scroll');
    // Should preserve other settings
    expect(prefs.ui.theme).toBe('dark');
  });

  it('handles invalid view mode values gracefully', () => {
    // Try to set invalid value (TypeScript would catch this, but testing runtime)
    const prefs = UserPreferencesService.loadPreferences();
    prefs.ui.analysisViewMode = 'invalid' as any;
    UserPreferencesService.savePreferences(prefs);

    // Should still load without crashing
    const loaded = UserPreferencesService.loadPreferences();
    expect(loaded.ui).toBeDefined();
  });

  it('emits preferencesChanged event when view mode changes', () => {
    const eventSpy = vi.fn();
    window.addEventListener('preferencesChanged', eventSpy);

    UserPreferencesService.setPreference('ui', 'analysisViewMode', 'tabs');

    expect(eventSpy).toHaveBeenCalled();

    window.removeEventListener('preferencesChanged', eventSpy);
  });
});
