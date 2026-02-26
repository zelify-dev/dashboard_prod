import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Link from "next/link";
import { useSidebarContext } from "./sidebar-context";

const menuItemBaseStyles = cva(
  "rounded-lg px-3.5 font-medium text-dark-4 transition-all duration-200 dark:text-dark-6",
  {
    variants: {
      isActive: {
        true: "bg-[#F3F2FE] text-primary hover:bg-[#F3F2FE] dark:bg-[#343E4E] dark:text-white", // Solid equivalent of previous rgba for better opacity handling
        false:
          "hover:bg-gray-100 hover:text-dark hover:dark:bg-[#FFFFFF1A] hover:dark:text-white",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
    "data-tour-id"?: string;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const { className, children, isActive, "data-tour-id": dataTourId, ...rest } = props;

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        // Close sidebar on clicking link if it's mobile
        onClick={() => isMobile && toggleSidebar()}
        data-tour-id={dataTourId}
        className={cn(
          menuItemBaseStyles({
            isActive: isActive,
            className: "relative block py-2",
          }),
          className,
        )}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={props.onClick}
      aria-expanded={isActive}
      data-tour-id={dataTourId}
      className={menuItemBaseStyles({
        isActive: isActive,
        className: "flex w-full items-center gap-3 py-3",
      })}
    >
      {children}
    </button>
  );
}
