"use client";

import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

type SyntaxHighlightTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variant?: "dark" | "light";
};

export function SyntaxHighlightTextarea({
  value,
  onChange,
  placeholder,
  className,
  variant = "dark",
}: SyntaxHighlightTextareaProps) {
  const preRef = useRef<HTMLPreElement | null>(null);
  const highlighted = useMemo(() => highlightHtml(value), [value]);
  const placeholderClass = variant === "dark" ? "text-white/40" : "text-slate-500";
  const baseTextClass = variant === "dark" ? "text-white" : "text-slate-900";
  const caretClass =
    variant === "dark" ? "caret-white selection:bg-white/30" : "caret-slate-900 selection:bg-slate-300/80";
  const placeholderOffset = variant === "dark" ? "top-14" : "top-14";
  const sharedPadding = "px-6";
  const sharedLineHeight = "leading-7";
  const sharedMinHeight = "min-h-[800px]";

  return (
    <div className={cn("relative w-full", sharedMinHeight, className)}>
      <pre
        ref={preRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap break-words font-mono text-xs",
          sharedPadding,
          "py-8",
          sharedLineHeight,
          baseTextClass,
        )}
        dangerouslySetInnerHTML={{ __html: highlighted || "&nbsp;" }}
      />
      {!value && placeholder && (
        <span className={cn("pointer-events-none absolute left-6 text-xs", placeholderClass, placeholderOffset)}>
          {placeholder}
        </span>
      )}
      <textarea
        value={value}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (preRef.current) {
            preRef.current.scrollTop = event.currentTarget.scrollTop;
            preRef.current.scrollLeft = event.currentTarget.scrollLeft;
          }
        }}
        className={cn(
          "relative z-10 h-full min-h-[inherit] w-full resize-none border-0 bg-transparent font-mono text-xs text-transparent focus:outline-none",
          sharedPadding,
          "py-8",
          sharedLineHeight,
          caretClass,
        )}
        style={{ minHeight: "inherit" }}
      />
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightHtml(content: string) {
  let escaped = escapeHtml(content);
  escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, `<span class="text-slate-400">$1</span>`);
  escaped = escaped.replace(
    /(&lt;\/?)([\w:-]+)([^&]*?)(\/?&gt;)/g,
    (_match: string, open: string, tagName: string, attrs: string, close: string) => {
      let attrText = attrs;
      attrText = attrText.replace(
        /([\s/]+)([\w:-]+)(\s*=\s*)(?:(&quot;.*?&quot;)|(&#39;.*?&#39;))/g,
        (
          _m: string,
          leading: string,
          attrName: string,
          equal: string,
          doubleQuoted?: string,
          singleQuoted?: string,
        ) => {
          const value = doubleQuoted ?? singleQuoted ?? "";
          return `${leading}<span class="text-amber-200">${attrName}</span><span class="text-slate-500">${equal}</span><span class="text-emerald-300">${value}</span>`;
        },
      );
      attrText = attrText.replace(/([\s/]+)([\w:-]+)/g, (_m: string, leading: string, attrName: string) => {
        return `${leading}<span class="text-amber-200">${attrName}</span>`;
      });
      return `<span class="text-slate-500">${open}</span><span class="text-sky-300">${tagName}</span>${attrText}<span class="text-slate-500">${close}</span>`;
    },
  );
  escaped = escaped.replace(/\$\{[^}]+\}/g, (match: string) => `<span class="text-pink-300">${match}</span>`);
  return escaped;
}
