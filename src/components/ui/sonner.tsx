"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { AlertTriangle, Check, Info, LoaderCircle, X } from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
            <Check className="size-4" />
        ),
        info: (
            <Info className="size-4" />
        ),
        warning: (
            <AlertTriangle className="size-4" />
        ),
        error: (
            <X className="size-4" />
        ),
        loading: (
          <LoaderCircle className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
