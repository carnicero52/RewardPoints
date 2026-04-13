"use client"

import { useState, useEffect, createContext, useContext, useCallback } from "react"

export type ToasterToast = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "success" | "destructive"
}

type ToasterContextType = {
  toasts: ToasterToast[]
  toast: (toast: Omit<ToasterToast, "id">) => void
  dismiss: (id: string) => void
}

const ToasterContext = createContext<ToasterContextType | null>(null)

export function useToast() {
  const context = useContext(ToasterContext)
  if (!context) throw new Error("useToast must be used within ToasterProvider")
  return context
}

export { ToasterContext }
