'use client'

import React, { ReactNode } from 'react'
import { ToastContainer, toast, ToastOptions } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

interface ToastProps {
  position?: ToastOptions['position']
  autoClose?: number
  hideProgressBar?: boolean
  newestOnTop?: boolean
  closeOnClick?: boolean
  rtl?: boolean
  pauseOnFocusLoss?: boolean
  draggable?: boolean
  pauseOnHover?: boolean
}

export const ToastProvider: React.FC<ToastProps> = ({
  position = 'top-right',
  autoClose = 3000,
  hideProgressBar = false,
  newestOnTop = true,
  closeOnClick = true,
  rtl = false,
  pauseOnFocusLoss = true,
  draggable = true,
  pauseOnHover = true
}) => {
  return (
    <ToastContainer
      position={position}
      autoClose={autoClose}
      hideProgressBar={hideProgressBar}
      newestOnTop={newestOnTop}
      closeOnClick={closeOnClick}
      rtl={rtl}
      pauseOnFocusLoss={pauseOnFocusLoss}
      draggable={draggable}
      pauseOnHover={pauseOnHover}
      toastClassName="!bg-white !text-gray-900 !rounded-lg !shadow-lg !border !border-gray-200"
      // Corrigé : Utiliser className au lieu de bodyClassName
      className="font-sans"
      progressClassName="!bg-blue-600"
    />
  )
}

interface CustomToastOptions {
  title?: string
  description?: string
  icon?: ReactNode
}

const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, options?: CustomToastOptions) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  }

  const content = (
    <div className="flex items-start">
      {options?.icon || icons[type]}
      <div className="ml-3">
        {options?.title && (
          <div className="font-medium text-sm">{options.title}</div>
        )}
        <div className="text-sm text-gray-600 mt-1">{message}</div>
      </div>
    </div>
  )

  switch (type) {
    case 'success':
      toast.success(content)
      break
    case 'error':
      toast.error(content)
      break
    case 'warning':
      toast.warning(content)
      break
    case 'info':
      toast.info(content)
      break
  }
}

export const toastSuccess = (message: string, options?: CustomToastOptions) => 
  showToast('success', message, options)

export const toastError = (message: string, options?: CustomToastOptions) => 
  showToast('error', message, options)

export const toastWarning = (message: string, options?: CustomToastOptions) => 
  showToast('warning', message, options)

export const toastInfo = (message: string, options?: CustomToastOptions) => 
  showToast('info', message, options)

export { toast }