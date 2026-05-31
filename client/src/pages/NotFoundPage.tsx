import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { WifiOff, ArrowLeft } from "lucide-react";
import { cn } from "../utils/cn";

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary px-4">
      {/* Animated gradient orbs — matches login page */}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* Floating sensor icon */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          className="mb-6 flex items-center justify-center h-20 w-20 rounded-2xl glass text-text-muted"
        >
          <WifiOff size={36} />
        </motion.div>

        {/* 404 gradient text */}
        <h1
          className={cn(
            "text-9xl font-extrabold leading-none",
            "bg-linear-to-r from-accent-blue to-accent-violet bg-clip-text text-transparent",
            "select-none"
          )}
        >
          404
        </h1>

        <h2 className="mt-4 text-2xl font-bold text-text-primary">
          Signal Lost
        </h2>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          to="/"
          className={cn(
            "mt-8 flex items-center gap-2 h-11 px-6 rounded-xl font-semibold text-white",
            "bg-linear-to-r from-accent-blue to-accent-violet",
            "transition-all duration-200",
            "hover:scale-[1.02] hover:shadow-lg hover:shadow-accent-blue/25",
            "active:scale-[0.99]",
            "focus-ring"
          )}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
