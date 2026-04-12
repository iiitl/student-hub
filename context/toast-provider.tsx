'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type: ToastType
}

interface ToastContextType {
  toasts: ToastMessage[]
  addToast: (title: string, description?: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (
    title: string,
    description?: string,
    type: ToastType = 'info'
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, title, description, type }])
    setTimeout(() => removeToast(id), 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <ToastViewport toasts={toasts} onRemove={removeToast} />
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastItemProps {
  id: string
  title: string
  description?: string
  type: ToastType
  onRemove: (id: string) => void
}

const toastStyles: Record<
  ToastType,
  { bg: string; border: string; icon: string }
> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
}

const ToastItem = ({
  id,
  title,
  description,
  type,
  onRemove,
}: ToastItemProps) => {
  const styles = toastStyles[type]

  return (
    <div
      style={{
        animation: 'slideIn 0.3s ease-in-out',
      }}
      className={`${styles.bg} border ${styles.border} rounded-lg shadow-lg p-4 pointer-events-auto`}
    >
      <div className="flex gap-3 items-start">
        <div className={`${styles.icon} mt-0.5 flex-shrink-0`}>
          {type === 'success' && <CheckCircle2 className="w-5 h-5" />}
          {type === 'error' && <AlertCircle className="w-5 h-5" />}
          {type === 'info' && <Info className="w-5 h-5" />}
          {type === 'warning' && <AlertTriangle className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900 dark:text-gray-50">
            {title}
          </div>
          {description && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </div>
          )}
        </div>
        <button
          onClick={() => onRemove(id)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
          title="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

const ToastViewport = ({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}) => {
  return (
    <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4 pointer-events-none max-w-md">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          type={toast.type}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
