import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Remove fixed heights and ensure safe text handling to avoid overflow on mobile
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-center whitespace-nowrap overflow-hidden text-ellipsis min-w-0 max-w-full",
  {
    variants: {
      variant: {
        default: "bg-neon-teal text-white hover:bg-neon-teal/90 shadow-lg shadow-neon-teal/25",
        secondary: "bg-white/10 text-foreground hover:bg-white/20 border border-white/20",
        outline: "border border-white/30 bg-transparent hover:bg-white/10 text-foreground",
        ghost: "hover:bg-white/10 text-foreground",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        link: "bg-transparent text-foreground underline-offset-4 hover:underline"
      },
      size: {
        // Use padding + font size so height grows with content
        default: "px-4 py-2 text-sm sm:text-base",
        sm: "px-3 py-1.5 text-sm",
        lg: "px-6 py-3 text-base sm:text-lg",
        // Icon buttons remain square
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <div
          className={cn(buttonVariants({ variant, size, className }))}
          {...(props as any)}
        />
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
