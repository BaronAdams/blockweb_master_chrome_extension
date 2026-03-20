"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { Icon } from "@iconify/react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
            <Icon icon="gg:check-o" className="size-4" />
        ),
        info: (
            <Icon icon="ic:outline-info" className="size-4" />
        ),
        warning: (
            <Icon icon="octicon:alert-24" className="size-4" />
        ),
        error: (
            <Icon icon="maki:cross" className="size-4" />
        ),
        loading: (
          <Icon icon="codex:loader" className="size-4" />
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
