import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted font-medium",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Financial specific avatar for advisors
const AdvisorAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    name: string
    tier?: 'basic' | 'premium' | 'elite'
    src?: string
  }
>(({ className, name, tier = 'basic', src, ...props }, ref) => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const tierColors = {
    basic: "bg-slate-500 text-white",
    premium: "bg-yellow-500 text-slate-900",
    elite: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900 font-semibold"
  }

  return (
    <Avatar
      ref={ref}
      className={cn(
        tier === 'elite' && "ring-2 ring-yellow-400 ring-offset-2",
        tier === 'premium' && "ring-1 ring-yellow-300 ring-offset-1",
        className
      )}
      {...props}
    >
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className={tierColors[tier]}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
})
AdvisorAvatar.displayName = "AdvisorAvatar"

export { Avatar, AvatarImage, AvatarFallback, AdvisorAvatar }