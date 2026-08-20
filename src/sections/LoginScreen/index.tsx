import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

export const LoginScreen = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed.";
      setError(
        msg.includes("Invalid login credentials")
          ? "Invalid email or password."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://sdejmmvtjzimhejwkvae.supabase.co/storage/v1/object/public/site-assets/nj-handgun-market-intelligence.png"
            alt="NJ Handgun Market Intelligence"
            className="h-14 w-auto object-contain mb-6"
          />
          <h1 className="text-white text-2xl font-bold tracking-tight">
            Market Intelligence Dashboard
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-2">
            Sign in to access the dashboard
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-slate-300 text-sm font-semibold mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="w-full bg-slate-800/50 text-white rounded-lg border border-white/10 px-4 py-3 text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-slate-300 text-sm font-semibold mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-slate-800/50 text-white rounded-lg border border-white/10 px-4 py-3 text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg px-4 py-3 transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-slate-500 text-xs font-medium text-center mt-6">
          Authorized access only. Contact your administrator for credentials.
        </p>
      </div>
    </div>
  );
};
