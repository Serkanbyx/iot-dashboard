import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import * as authService from "../api/authService";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(() => !!localStorage.getItem("token"));
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (verified) return;

    let active = true;
    authService
      .getMe()
      .then((res) => {
        if (active) setUser(res.user);
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setVerified(true);
        }
      });
    return () => {
      active = false;
    };
  }, [token, verified]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await authService.register({ name, email, password });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === "ADMIN";

  const value = useMemo(
    () => ({ user, token, loading, isAdmin, login, register, logout }),
    [user, token, loading, isAdmin, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
