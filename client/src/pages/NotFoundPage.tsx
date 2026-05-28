import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-text-muted">404</h1>
      <p className="text-lg text-text-secondary">Page not found</p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/90 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
