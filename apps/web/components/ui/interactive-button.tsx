"use client"

import * as React from "react"
import { Button, ButtonProps } from "./button"
import { useNotifications } from "@/lib/hooks/useNotifications"

interface InteractiveButtonProps extends ButtonProps {
  hapticFeedback?: boolean
  confirmAction?: boolean
  confirmMessage?: string
  successMessage?: string
  errorMessage?: string
  disabled?: boolean
}

export const InteractiveButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveButtonProps
>(({ 
  children,
  onClick,
  hapticFeedback = true,
  confirmAction = false,
  confirmMessage = "Are you sure?",
  successMessage,
  errorMessage,
  disabled,
  variant,
  ...props 
}, ref) => {
  const { notifySuccess, notifyError } = useNotifications()
  const [isLoading, setIsLoading] = React.useState(false)

  const handleClick = React.useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return

    // Haptic feedback for mobile devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }

    // Confirmation dialog for destructive actions
    if (confirmAction) {
      const confirmed = window.confirm(confirmMessage)
      if (!confirmed) return
    }

    try {
      setIsLoading(true)
      
      // Execute the onClick handler
      if (onClick) {
        await onClick(event)
      }

      // Success notification
      if (successMessage) {
        notifySuccess('Action Completed', successMessage)
      }

    } catch (error) {
      console.error('Button action failed:', error)
      
      // Error notification
      if (errorMessage) {
        notifyError('Action Failed', errorMessage)
      } else {
        notifyError('Error', 'Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [
    disabled,
    isLoading,
    hapticFeedback,
    confirmAction,
    confirmMessage,
    onClick,
    successMessage,
    errorMessage,
    notifySuccess,
    notifyError
  ])

  return (
    <Button
      ref={ref}
      onClick={handleClick}
      disabled={disabled || isLoading}
      variant={variant}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Processing...
        </div>
      ) : (
        children
      )}
    </Button>
  )
})

InteractiveButton.displayName = "InteractiveButton"

// Preset button variants for common actions
export const WhatsAppSendButton = React.forwardRef<
  HTMLButtonElement,
  Omit<InteractiveButtonProps, 'variant' | 'successMessage'>
>(({ children, ...props }, ref) => (
  <InteractiveButton
    ref={ref}
    variant="whatsapp"
    successMessage="WhatsApp message sent successfully!"
    {...props}
  >
    {children}
  </InteractiveButton>
))

export const ComplianceCheckButton = React.forwardRef<
  HTMLButtonElement,
  Omit<InteractiveButtonProps, 'variant'>
>(({ children, ...props }, ref) => (
  <InteractiveButton
    ref={ref}
    variant="compliance"
    {...props}
  >
    {children}
  </InteractiveButton>
))

export const PremiumActionButton = React.forwardRef<
  HTMLButtonElement,
  Omit<InteractiveButtonProps, 'variant'>
>(({ children, ...props }, ref) => (
  <InteractiveButton
    ref={ref}
    variant="premium"
    hapticFeedback={true}
    {...props}
  >
    {children}
  </InteractiveButton>
))

export const DeleteButton = React.forwardRef<
  HTMLButtonElement,
  Omit<InteractiveButtonProps, 'variant' | 'confirmAction'>
>(({ children, confirmMessage = "Are you sure you want to delete this item?", ...props }, ref) => (
  <InteractiveButton
    ref={ref}
    variant="destructive"
    confirmAction={true}
    confirmMessage={confirmMessage}
    errorMessage="Failed to delete item"
    {...props}
  >
    {children}
  </InteractiveButton>
))