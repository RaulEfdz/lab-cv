"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  iconMap,
  iconColorMap,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const variantKey = variant || "default"
        const Icon = iconMap[variantKey as keyof typeof iconMap]
        const iconColor = iconColorMap[variantKey as keyof typeof iconColorMap]

        return (
          <Toast key={id} variant={variant} {...props}>
            {/* Icon */}
            <div className="flex-shrink-0 pt-0.5">
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>

            {/* Content */}
            <div className="flex-1 grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>

            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}