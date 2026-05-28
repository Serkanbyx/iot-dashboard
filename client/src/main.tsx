import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--color-bg-card)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-glass-border)",
                  backdropFilter: "blur(12px)",
                },
                success: {
                  iconTheme: {
                    primary: "var(--color-success)",
                    secondary: "var(--color-bg-card)",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "var(--color-danger)",
                    secondary: "var(--color-bg-card)",
                  },
                },
              }}
            />
            <App />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
