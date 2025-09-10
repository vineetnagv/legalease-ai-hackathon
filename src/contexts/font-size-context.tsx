"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

type FontSize = "text-sm" | "text-base" | "text-lg"

interface FontContextType {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
}

const FontContext = createContext<FontContextType | undefined>(undefined)

export const FontProvider = ({ children }: { children: ReactNode }) => {
  const [fontSize, setFontSize] = useState<FontSize>("text-base")

  useEffect(() => {
    const storedFontSize = localStorage.getItem("app-font-size") as FontSize | null
    if (storedFontSize) {
      setFontSize(storedFontSize)
    }
  }, [])
  
  useEffect(() => {
    document.documentElement.classList.remove("text-sm", "text-base", "text-lg")
    document.documentElement.classList.add(fontSize)
    localStorage.setItem("app-font-size", fontSize)
  }, [fontSize])

  return (
    <FontContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontContext.Provider>
  )
}

export const useFont = (): FontContextType => {
  const context = useContext(FontContext)
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider")
  }
  return context
}
