'use client'

import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function Input({
  label,
  className = '',
  id,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-3 py-2 rounded-lg
          bg-surface border border-border
          text-text placeholder:text-muted/50
          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
          transition-colors duration-150
          ${className}
        `}
        {...props}
      />
    </div>
  )
}
