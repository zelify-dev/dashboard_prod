import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSidebarContext } from "./sidebar-context";

export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
    title?: string;
    isSubItem?: boolean;
    "data-tour-id"?: string;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { toggleSidebar, isMobile, isCollapsed } = useSidebarContext();
  const { className, children, isActive, title, isSubItem, "data-tour-id": dataTourId, ...rest } = props;

  const baseStyles = cn(
    "flex items-center transition-all duration-200 font-light rounded-xl",
    isCollapsed && !isMobile ? "justify-center px-0" : "px-3.5 gap-3",
    isActive
      ? "bg-zelify-midnight text-white py-2.5"
      : "text-dark-4 hover:bg-gray-100 hover:text-dark py-2.5",
    className,
  );

  if (props.as === "link") {
    const href = props.href;
    const useNativeAnchor =
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("sms:");
    const closeOnNavigate = () => isMobile && toggleSidebar();

    if (useNativeAnchor) {
      return (
        <a
          href={href}
          onClick={closeOnNavigate}
          data-tour-id={dataTourId}
          title={isCollapsed ? title : undefined}
          className={cn(baseStyles, "relative w-full")}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        href={href}
        onClick={closeOnNavigate}
        data-tour-id={dataTourId}
        title={isCollapsed ? title : undefined}
        className={cn(baseStyles, "relative w-full")}
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
      className={cn(baseStyles, "w-full")}
    >
      {children}
    </button>
  );
}
