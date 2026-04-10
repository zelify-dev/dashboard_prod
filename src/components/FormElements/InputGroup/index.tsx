import { cn } from "@/lib/utils";
import { type HTMLInputTypeAttribute, useId } from "react";

type InputGroupProps = {
  className?: string;
  label: string;
  placeholder: string;
  type: HTMLInputTypeAttribute;
  fileStyleVariant?: "style1" | "style2";
  required?: boolean;
  disabled?: boolean;
  active?: boolean;
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  name?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  /** Contenido a la derecha del input (p. ej. botón ojito para contraseña). */
  endAdornment?: React.ReactNode;
  height?: "sm" | "default";
  defaultValue?: string;
  customInputClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const InputGroup: React.FC<InputGroupProps> = ({
  className,
  label,
  type,
  placeholder,
  required,
  disabled,
  active,
  handleChange,
  icon,
  iconPosition,
  endAdornment,
  height,
  fileStyleVariant,
  customInputClassName,
  ...restProps
}) => {
  const id = useId();
  const iconOnLeft = iconPosition === "left";
  const iconOnRight = Boolean(icon) && !iconOnLeft;
  const hasEnd = Boolean(endAdornment);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="text-body-sm font-medium text-dark dark:text-white"
      >
        {label}
        {required && <span className="ml-1 select-none text-red">*</span>}
      </label>

      <div className="relative mt-3">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          onChange={handleChange}
          className={cn(
            "w-full rounded-lg border-[1.5px] border-stroke bg-transparent outline-none transition focus:border-primary disabled:cursor-default disabled:bg-gray-2 data-[active=true]:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary dark:disabled:bg-dark dark:data-[active=true]:border-primary",
            type === "file"
              ? getFileStyles(fileStyleVariant!)
              : "px-5.5 py-3 text-dark placeholder:text-dark-6 dark:text-white",
            type !== "file" && iconOnLeft && "pl-12.5",
            type !== "file" &&
              iconOnRight &&
              !hasEnd &&
              "pr-12.5",
            type !== "file" && iconOnRight && hasEnd && "pr-[4.25rem]",
            type !== "file" && iconOnLeft && hasEnd && "pr-11",
            type !== "file" && !icon && hasEnd && "pr-11",
            height === "sm" && "py-2.5",
            customInputClassName
          )}
          required={required}
          disabled={disabled}
          data-active={active}
          {...restProps}
        />

        {icon && (
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-dark-5",
              iconOnLeft ? "left-4.5" : "right-4.5",
            )}
          >
            {icon}
          </span>
        )}
        {endAdornment && (
          <span className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-dark-5">{endAdornment}</span>
        )}
      </div>
    </div>
  );
};

export default InputGroup;

function getFileStyles(variant: "style1" | "style2") {
  switch (variant) {
    case "style1":
      return `file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-[#E2E8F0] file:px-6.5 file:py-[13px] file:text-body-sm file:font-medium file:text-dark-5 file:hover:bg-primary file:hover:bg-opacity-10 dark:file:border-dark-3 dark:file:bg-white/30 dark:file:text-white`;
    default:
      return `file:mr-4 file:rounded file:border-[0.5px] file:border-stroke file:bg-stroke file:px-2.5 file:py-1 file:text-body-xs file:font-medium file:text-dark-5 file:focus:border-primary dark:file:border-dark-3 dark:file:bg-white/30 dark:file:text-white px-3 py-[9px]`;
  }
}
