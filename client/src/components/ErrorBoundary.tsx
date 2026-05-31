import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "../utils/cn";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl glass text-danger mb-4">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            An unexpected error occurred. Try reloading the page.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-w-full overflow-x-auto rounded-lg bg-bg-elevated p-3 text-xs text-danger text-left">
              {this.state.error.message}
            </pre>
          )}

          <button
            type="button"
            onClick={this.handleReload}
            className={cn(
              "mt-6 flex items-center gap-2 h-10 px-5 rounded-xl font-semibold text-white",
              "bg-accent-blue hover:bg-accent-blue/90",
              "transition-colors duration-150 focus-ring"
            )}
          >
            <RefreshCw size={16} />
            Reload
          </button>
        </div>
      </div>
    );
  }
}
