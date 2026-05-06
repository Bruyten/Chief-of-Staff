import { useState } from "react";
import { useApp } from "../AppContext";
import { Button, Input } from "../ui/Primitives";
import { friendlyError } from "../lib/apiClient";

export function LoginPage() {
  const { loginWith, signupWith, mode: appMode, setMode: setAppMode, toast } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState(appMode === "live" ? "demo@chiefofstaff.app" : "you@chiefofstaff.app");
  const [password, setPassword] = useState("demo1234");
  const [name, setName] = useState("Demo User");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") await signupWith(email, password, name);
      else await loginWith(email, password);
    } catch (err) {
      setError(friendlyError(err));
      toast(friendlyError(err), "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#06070a] min-h-screen relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,0.15),_transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(236,72,153,0.12),_transparent_50%)] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 grid place-items-center text-white font-bold text-lg shadow-2xl shadow-violet-500/30">
              CS
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-white/55 mt-2 text-[14px]">
            {mode === "signup"
              ? "Generate marketing copy in 60 seconds. Free to start."
              : "Sign in to keep building."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6 backdrop-blur">
          <form onSubmit={onSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <Input
                label="Your name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              hint={mode === "signup" ? "Minimum 8 characters." : undefined}
            />
            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              {mode === "signup" ? "Create account →" : "Sign in →"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-white/5 text-center text-[13px] text-white/55">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="text-violet-300 hover:text-violet-200 font-semibold"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 text-center text-[12px] text-rose-300 bg-rose-500/10 border border-rose-400/20 rounded-lg py-2 px-3">
            {error}
          </div>
        )}

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-2">
            Backend mode
          </div>
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-white/[0.04] rounded-lg">
            <button
              onClick={() => setAppMode("mock")}
              className={
                "text-[11px] font-medium py-1.5 rounded-md transition " +
                (appMode === "mock" ? "bg-white text-black" : "text-white/60 hover:text-white")
              }
            >
              🧪 Mock data
            </button>
            <button
              onClick={() => setAppMode("live")}
              className={
                "text-[11px] font-medium py-1.5 rounded-md transition " +
                (appMode === "live" ? "bg-emerald-500 text-white" : "text-white/60 hover:text-white")
              }
            >
              🟢 Live API
            </button>
          </div>
          <div className="text-[10.5px] text-white/40 mt-2 leading-relaxed">
            {appMode === "mock" ? (
              <>Any email/password works — uses local seed data.</>
            ) : (
              <>
                Talks to <code className="text-emerald-300">localhost:4000</code>. Run the
                server first: <code className="text-emerald-300">cd server && npm run dev</code>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
