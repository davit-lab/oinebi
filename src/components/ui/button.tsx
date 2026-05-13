import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] active:translate-y-[1px]",
  {
    variants: {
      variant: {
        default: "text-white shadow-pop hover:scale-[1.02] hover:shadow-lg",
        white: "bg-white text-primary shadow-pop hover:scale-[1.02] hover:shadow-lg",
        outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
        ghost: "text-primary hover:bg-primary/10",
        image: "text-white shadow-pop hover:scale-[1.02] hover:shadow-lg",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-14 px-8 py-4",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  backgroundImage?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, backgroundImage, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const defaultImage = "https://scontent.ftbs5-2.fna.fbcdn.net/v/t1.15752-9/689939249_999202976128750_5642019169898460735_n.png?_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_ohc=i8pLFFAH-F0Q7kNvwHoZtf-&_nc_oc=AdpQ1XRKLjxa7zHRohQRLeS7C9kBJ1VIX0CEUxAK-PAGtLg6_f1Qq1Rw1qsO6ZPOVoI&_nc_zt=23&_nc_ht=scontent.ftbs5-2.fna&_nc_ss=7b2a8&oh=03_Q7cD5QFl6xI4GqCiPKzwQ1kQiZ6tu-_o2KW6BdOr9lQehIl5AQ&oe=6A2394B3";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={{ backgroundImage: `url(${backgroundImage || defaultImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
