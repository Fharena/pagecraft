'use client'

import { useState, useCallback, useEffect } from 'react'

interface ToastMessage {
  id: number
  text: string
  type: 'success' | 'error' | 'info'
}

let addToastFn: ((text: string, type?: ToastMessage['type']) => void) | null = null

export function showToast(text: string, type: ToastMessage['type'] = 'success') {
  addToastFn?.(text, type)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback(
    (text: string, type: ToastMessage['type'] = 'success') => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, text, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 2500)
    },
    [],
  )

  useEffect(() => {
    addToastFn = addToast
    return () => {
      addToastFn = null
    }
  }, [addToast])

  if (toasts.length === 0) return null

  const typeColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-accent',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${typeColors[t.type]} text-black px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
