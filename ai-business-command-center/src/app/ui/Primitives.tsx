// Reusable UI primitives — Button, Input, Textarea, Select, Card, Badge,
// Modal, EmptyState, LoadingState, Spinner, Skeleton, CopyButton, SaveButton.
// All use Tailwind only, no external libraries.

import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

// ---------- Button ----------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
};
export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const variants = {
    primary: "bg-white text-black hover:bg-white/90 disabled:bg-white/50",
    secondary: "bg-white/[0.06] text-white border border-white/10 hover:bg-white/10 hover:border-white/20",
    ghost: "text-white/70 hover:text-white hover:bg-white/5",
    danger: "bg-rose-500/10 text-rose-200 border border-rose-400/20 hover:bg-rose-500/20",
  };
  const sizes = {
    sm: "text-[12px] px-2.5 py-1.5 rounded-md",
    md: "text-[13px] px-3.5 py-2 rounded-lg",
    lg: "text-[14px] px-4 py-2.5 rounded-lg",
  };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? <Spinner size={size === "lg" ? 16 : 14} /> : icon}
      {children}
    </button>
  );
}

// ---------- Input ----------
type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};
export function Input({ label, hint, error, className, id, ...rest }: InputProps) {
  const inputId = id ?? `in_${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-[12px] font-medium text-white/70 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...rest}
        className={cn(
          "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white placeholder:text-white/30",
          "focus:outline-none focus:border-violet-400/50 focus:bg-white/[0.06] transition",
          error && "border-rose-400/40",
          className
        )}
      />
      {hint && !error && <div className="text-[11px] text-white/40 mt-1">{hint}</div>}
      {error && <div className="text-[11px] text-rose-300 mt-1">{error}</div>}
    </div>
  );
}

// ---------- Textarea ----------
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};
export function Textarea({ label, hint, error, className, id, ...rest }: TextareaProps) {
  const inputId = id ?? `ta_${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-[12px] font-medium text-white/70 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        {...rest}
        className={cn(
          "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white placeholder:text-white/30 leading-relaxed resize-y",
          "focus:outline-none focus:border-violet-400/50 focus:bg-white/[0.06] transition",
          error && "border-rose-400/40",
          className
        )}
      />
      {hint && !error && <div className="text-[11px] text-white/40 mt-1">{hint}</div>}
      {error && <div className="text-[11px] text-rose-300 mt-1">{error}</div>}
    </div>
  );
}

// ---------- Select ----------
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string; label: string }[];
  hint?: string;
};
export function Select({ label, hint, options, className, id, ...rest }: SelectProps) {
  const inputId = id ?? `sel_${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-[12px] font-medium text-white/70 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={inputId}
        {...rest}
        className={cn(
          "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white",
          "focus:outline-none focus:border-violet-400/50 transition appearance-none",
          "bg-[length:14px] bg-no-repeat bg-[right_0.75rem_center]",
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='%23ffffff80' stroke-width='1.5'%3E%3Cpath d='M1 1l5 5 5-5'/%3E%3C/svg%3E\")",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0b0d12]">
            {o.label}
          </option>
        ))}
      </select>
      {hint && <div className="text-[11px] text-white/40 mt-1">{hint}</div>}
    </div>
  );
}

// ---------- Card ----------
export function Card({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

// ---------- Badge ----------
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "danger" | "info" | "violet";
  className?: string;
}) {
  const tones = {
    neutral: "bg-white/[0.06] text-white/70 border-white/10",
    success: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20",
    warn: "bg-amber-500/10 text-amber-200 border-amber-400/20",
    danger: "bg-rose-500/10 text-rose-200 border-rose-400/20",
    info: "bg-sky-500/10 text-sky-200 border-sky-400/20",
    violet: "bg-violet-500/10 text-violet-200 border-violet-400/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// ---------- Modal ----------
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  if (!open) return null;
  const sizes = { md: "max-w-md", lg: "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full bg-[#0b0d12] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]", sizes[size])}>
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none w-7 h-7 grid place-items-center rounded-md hover:bg-white/5">
            ×
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-white/10 flex items-center justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Empty state ----------
export function EmptyState({
  icon = "✨",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-14 px-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-white font-semibold text-base">{title}</div>
      {description && <div className="text-white/50 text-[13.5px] mt-1.5 max-w-md mx-auto leading-relaxed">{description}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- Loading state ----------
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-white/50">
      <Spinner size={22} />
      <div className="mt-3 text-[13px]">{label}</div>
    </div>
  );
}

// ---------- Spinner ----------
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ---------- Skeleton ----------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-white/[0.06] animate-pulse", className)} />;
}

// ---------- Copy button ----------
export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
    >
      {copied ? "✓ Copied" : `📋 ${label}`}
    </Button>
  );
}

// ---------- Save button ----------
export function SaveButton({ onSave, saved, className }: { onSave: () => void; saved?: boolean; className?: string }) {
  return (
    <Button variant="primary" size="sm" onClick={onSave} className={className} disabled={saved}>
      {saved ? "✓ Saved" : "💾 Save to Library"}
    </Button>
  );
}
