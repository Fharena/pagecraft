import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-xl border border-border p-4 ${className}`}
    >
      {children}
    </div>
  )
}
