import { cva, VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 text-center font-light transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-zelify-midnight hover:bg-black text-white",
        green: "bg-emerald-600 hover:bg-emerald-700 text-white",
        dark: "bg-dark hover:bg-black text-white",
        outlinePrimary:
          "border border-gray-200 bg-white hover:bg-gray-50 text-dark",
        outlineGreen: "border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-600",
        outlineDark:
          "border border-gray-200 bg-white hover:bg-gray-50 text-dark",
      },
      shape: {
        default: "rounded-xl",
        rounded: "rounded-xl",
        full: "rounded-xl",
      },
      size: {
        default: "py-2.5 px-5 text-xs",
        small: "py-2 px-4 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      shape: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    label: string;
    icon?: React.ReactNode;
  };

export function Button({
  label,
  icon,
  variant,
  shape,
  size,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, shape, size, className })}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}
