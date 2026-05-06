import { useApp } from "../AppContext";
import { cn } from "../../utils/cn";

export function Toaster() {
  const { toasts } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "px-4 py-2.5 rounded-lg border shadow-2xl backdrop-blur text-[13px] font-medium animate-[slideUp_0.2s_ease-out]",
            t.tone === "danger" && "bg-rose-500/15 border-rose-400/30 text-rose-100",
            t.tone === "info" && "bg-sky-500/15 border-sky-400/30 text-sky-100",
            (t.tone === "success" || !t.tone) && "bg-emerald-500/15 border-emerald-400/30 text-emerald-100"
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
