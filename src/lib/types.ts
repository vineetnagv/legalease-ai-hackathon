
export const supportedLanguages = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  ta: 'தமிழ் (Tamil)',
  kn: 'ಕನ್ನಡ (Kannada)',
  bn: 'বাংলা (Bengali)',
  mr: 'मराठी (Marathi)',
  gu: 'ગુજરાતી (Gujarati)',
  ml: 'മലയാളം (Malayalam)',
  te: 'తెలుగు (Telugu)',
  ur: 'اردو (Urdu)',
} as const;

export type LanguageCode = keyof typeof supportedLanguages;

// A mapping for the AI, which prefers the simple English name.
export const languageForAI: Record<LanguageCode, string> = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
    kn: 'Kannada',
    bn: 'Bengali',
    mr: 'Marathi',
    gu: 'Gujarati',
    ml: 'Malayalam',
    te: 'Telugu',
    ur: 'Urdu',
};

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}
