/**
 * @fileOverview User preferences and settings management with localStorage persistence.
 */

export interface UserPreferences {
  // Chat Settings
  chatSettings: {
    saveChatHistory: boolean;
    autoSuggestQuestions: boolean;
    voiceEnabled: boolean;
  };

  // Accessibility Settings
  accessibility: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
  };

  // Analysis Settings
  analysis: {
    autoStartAnalysis: boolean;
    showDetailedExplanations: boolean;
    exportFormat: 'pdf' | 'text' | 'json';
    includeVoiceInExports: boolean;
  };

  // UI Settings
  ui: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    showAnimations: boolean;
    compactMode: boolean;
    dockPosition: 'right' | 'left' | 'bottom';
    analysisViewMode: 'scroll' | 'tabs';
  };

  // Privacy Settings
  privacy: {
    analyticsOptIn: boolean;
    errorReportingOptIn: boolean;
    documentRetention: 'never' | '7days' | '30days' | '90days' | 'forever';
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
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
  ui: {
    theme: 'system',
    language: 'en',
    showAnimations: true,
    compactMode: false,
    dockPosition: 'right',
    analysisViewMode: 'scroll',
  },
  privacy: {
    analyticsOptIn: false,
    errorReportingOptIn: true,
    documentRetention: '30days',
  },
};

const STORAGE_KEY = 'legalmind_user_preferences';

export class UserPreferencesService {
  /**
   * Loads user preferences from localStorage
   */
  static loadPreferences(): UserPreferences {
    try {
      if (typeof window === 'undefined') {
        return DEFAULT_PREFERENCES;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return DEFAULT_PREFERENCES;
      }

      const parsed = JSON.parse(stored);

      // Merge with defaults to handle new preference additions
      return this.mergeWithDefaults(parsed);
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Saves user preferences to localStorage
   */
  static savePreferences(preferences: UserPreferences): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

      // Apply theme immediately
      this.applyThemePreference(preferences.ui.theme);

      // Apply accessibility settings
      this.applyAccessibilitySettings(preferences.accessibility);

      // Emit custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('preferencesChanged', {
        detail: preferences
      }));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  /**
   * Updates a specific preference section
   */
  static updatePreferences(
    section: keyof UserPreferences,
    updates: Partial<UserPreferences[keyof UserPreferences]>
  ): UserPreferences {
    const current = this.loadPreferences();
    const updated = {
      ...current,
      [section]: {
        ...current[section],
        ...updates,
      },
    };

    this.savePreferences(updated);
    return updated;
  }

  /**
   * Resets all preferences to defaults
   */
  static resetToDefaults(): UserPreferences {
    this.savePreferences(DEFAULT_PREFERENCES);
    return DEFAULT_PREFERENCES;
  }

  /**
   * Gets a specific preference value
   */
  static getPreference<T extends keyof UserPreferences>(
    section: T,
    key: keyof UserPreferences[T]
  ): UserPreferences[T][keyof UserPreferences[T]] {
    const preferences = this.loadPreferences();
    return preferences[section][key];
  }

  /**
   * Sets a specific preference value
   */
  static setPreference<T extends keyof UserPreferences>(
    section: T,
    key: keyof UserPreferences[T],
    value: UserPreferences[T][keyof UserPreferences[T]]
  ): void {
    const current = this.loadPreferences();
    const updated = {
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    };

    this.savePreferences(updated);
  }

  /**
   * Applies theme preference to document
   */
  private static applyThemePreference(theme: UserPreferences['ui']['theme']): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }

  /**
   * Applies accessibility settings to document
   */
  private static applyAccessibilitySettings(accessibility: UserPreferences['accessibility']): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Font size
    root.style.setProperty('--base-font-size', this.getFontSizeValue(accessibility.fontSize));

    // High contrast
    root.classList.toggle('high-contrast', accessibility.highContrast);

    // Reduced motion
    root.classList.toggle('reduce-motion', accessibility.reducedMotion);

    // Screen reader optimization
    root.classList.toggle('screen-reader', accessibility.screenReaderOptimized);
  }

  /**
   * Gets CSS font size value for accessibility setting
   */
  private static getFontSizeValue(size: UserPreferences['accessibility']['fontSize']): string {
    const sizes = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px',
    };
    return sizes[size];
  }

  /**
   * Merges stored preferences with defaults to handle schema updates
   */
  private static mergeWithDefaults(stored: any): UserPreferences {
    const merged = { ...DEFAULT_PREFERENCES };

    // Deep merge each section
    Object.keys(DEFAULT_PREFERENCES).forEach(section => {
      if (stored[section] && typeof stored[section] === 'object') {
        merged[section as keyof UserPreferences] = {
          ...merged[section as keyof UserPreferences],
          ...stored[section],
        };
      }
    });

    return merged;
  }

  /**
   * Exports preferences as JSON for backup
   */
  static exportPreferences(): string {
    const preferences = this.loadPreferences();
    return JSON.stringify(preferences, null, 2);
  }

  /**
   * Imports preferences from JSON string
   */
  static importPreferences(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      const merged = this.mergeWithDefaults(imported);
      this.savePreferences(merged);
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }

  /**
   * Gets storage usage information
   */
  static getStorageInfo(): {
    sizeKB: number;
    lastModified: Date | null;
  } {
    try {
      if (typeof window === 'undefined') {
        return { sizeKB: 0, lastModified: null };
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      const sizeKB = stored ? Math.round(stored.length / 1024) : 0;

      // Try to get last modified from a separate timestamp
      const timestampKey = `${STORAGE_KEY}_timestamp`;
      const timestamp = localStorage.getItem(timestampKey);
      const lastModified = timestamp ? new Date(parseInt(timestamp)) : null;

      return { sizeKB, lastModified };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { sizeKB: 0, lastModified: null };
    }
  }

  /**
   * Initializes preferences on app start
   */
  static initialize(): UserPreferences {
    const preferences = this.loadPreferences();

    // Apply initial settings
    this.applyThemePreference(preferences.ui.theme);
    this.applyAccessibilitySettings(preferences.accessibility);

    // Set timestamp for last accessed
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY}_timestamp`, Date.now().toString());
    }

    return preferences;
  }
}