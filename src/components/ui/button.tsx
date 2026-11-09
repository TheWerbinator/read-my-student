import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-display font-bold uppercase tracking-[0.06em] leading-none transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 aria-invalid:ring-2 aria-invalid:ring-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-forest-ink",
        destructive: "bg-destructive text-white hover:bg-[#8f1d17]",
        outline:
          "bg-white text-forest-ink ring-1 ring-inset ring-ink/25 hover:bg-paper-2 hover:ring-forest",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[#e2e8e8]",
        ghost: "text-forest-ink hover:bg-ink/5",
        link: "text-forest normal-case tracking-normal font-sans font-semibold underline-offset-4 hover:underline",
        gold: "bg-gold text-board-deep hover:bg-[#ffb829]",
      },
      size: {
        default: "h-10 px-4 text-base has-[>svg]:px-3",
        sm: "h-9 gap-1.5 px-3 text-sm has-[>svg]:px-2.5",
        lg: "h-12 px-6 text-lg has-[>svg]:px-4",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
