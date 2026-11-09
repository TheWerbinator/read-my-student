import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonBase, buttonVariants as styles } from "./buttonStyles"

// Same base, colors, and hover tokens as LinkButton (./buttonStyles), so the
// two entry points render one button system. Default height is 44px.
const buttonVariants = cva(
  `${buttonBase} shrink-0 aria-invalid:ring-2 aria-invalid:ring-destructive`,
  {
    variants: {
      variant: {
        default: styles.primary,
        destructive: styles.destructive,
        outline: styles.secondary,
        secondary: "bg-secondary text-secondary-foreground hover:bg-paper-hover",
        ghost: styles.ghost,
        link: styles.link,
        gold: styles.gold,
      },
      size: {
        default: "h-11 px-4 text-base has-[>svg]:px-3",
        sm: "h-9 gap-1.5 px-3 text-sm has-[>svg]:px-2.5",
        lg: "h-12 px-6 text-lg has-[>svg]:px-4",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
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
