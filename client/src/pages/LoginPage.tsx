import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../utils/cn";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/", { replace: true });
    } catch {
      toast.error("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary px-4">
      {/* Animated gradient orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-accent-blue/15 blur-[120px] animate-[orb-float_20s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-accent-violet/15 blur-[120px] animate-[orb-float_25s_ease-in-out_infinite_reverse]" />
        <div className="absolute -bottom-24 left-1/3 h-[350px] w-[350px] rounded-full bg-accent-cyan/10 blur-[100px] animate-[orb-float_22s_ease-in-out_infinite_2s]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(59, 130, 246, 0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "relative z-10 w-full max-w-sm",
          "glass rounded-2xl p-8",
          "shadow-lg shadow-accent-blue/5"
        )}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="absolute h-12 w-12 rounded-full bg-accent-blue/20 animate-[live-pulse_2s_ease-in-out_infinite]" />
            <Activity className="relative h-7 w-7 text-accent-blue" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">IoT Dashboard</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Sensor Monitoring Command Center
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@iot-dashboard.com"
                className={cn(
                  "h-12 w-full rounded-xl pl-10 pr-4",
                  "bg-bg-elevated border border-glass-border",
                  "text-sm text-text-primary placeholder:text-text-muted",
                  "outline-none transition-all duration-150",
                  "focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
                )}
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={cn(
                  "h-12 w-full rounded-xl pl-10 pr-11",
                  "bg-bg-elevated border border-glass-border",
                  "text-sm text-text-primary placeholder:text-text-muted",
                  "outline-none transition-all duration-150",
                  "focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "relative h-12 w-full rounded-xl font-semibold text-white",
                "bg-linear-to-r from-accent-blue to-accent-violet",
                "transition-all duration-200",
                "hover:scale-[1.01] hover:shadow-lg hover:shadow-accent-blue/25",
                "active:scale-[0.99]",
                "disabled:opacity-70 disabled:pointer-events-none"
              )}
            >
              {loading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                "Access Dashboard"
              )}
            </button>
          </motion.div>
        </form>

        {/* Dev hint */}
        {import.meta.env.DEV && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-xs text-text-muted"
          >
            Default: admin@iot-dashboard.com / admin123
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
