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
    title?: string;
    "data-tour-id"?: string;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { toggleSidebar, isMobile, isCollapsed } = useSidebarContext();
  const { className, children, isActive, title, "data-tour-id": dataTourId, ...rest } = props;

  const baseStyles = cn(
    "flex items-center transition-all duration-200 rounded-lg font-medium",
    isCollapsed && !isMobile ? "justify-center px-0" : "px-3.5 gap-3",
    isActive
      ? "bg-[#F3F2FE] text-primary dark:bg-[#343E4E] dark:text-white"
      : "text-dark-4 dark:text-dark-6 hover:bg-gray-100 hover:text-dark hover:dark:bg-[#FFFFFF1A] hover:dark:text-white",
    className,
  );

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        onClick={() => isMobile && toggleSidebar()}
        data-tour-id={dataTourId}
        title={isCollapsed ? title : undefined}
        className={cn(baseStyles, "relative w-full py-2")}
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
      title={isCollapsed ? title : undefined}
      className={cn(baseStyles, "w-full py-3")}
    >
      {children}
    </button>
  );
}
