import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-ink-2 focus-visible:border-forest focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive flex field-sizing-content min-h-24 w-full rounded-[2px] border bg-white px-3 py-2 text-base text-ink transition-[border-color,box-shadow] outline-none disabled:cursor-not-allowed disabled:bg-paper-2 disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
