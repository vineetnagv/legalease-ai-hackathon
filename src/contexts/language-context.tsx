"use client";

import { supportedLanguages, type LanguageCode } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<LanguageCode>("en")

  useEffect(() => {
    const storedLanguage = localStorage.getItem("app-language") as LanguageCode | null
    if (storedLanguage && supportedLanguages[storedLanguage]) {
      setLanguage(storedLanguage)
    }
  }, [])
  
  const handleSetLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem("app-language", lang);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
