import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const refreshClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export interface RefreshResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "VIEWER";
  };
  token: string;
  refreshToken: string;
}

export async function refreshAuthTokens(
  refreshToken: string
): Promise<RefreshResponse> {
  const { data } = await refreshClient.post<RefreshResponse>("/auth/refresh", {
    refreshToken,
  });
  return data;
}

export async function logoutRefreshToken(refreshToken: string): Promise<void> {
  await refreshClient.post("/auth/logout", { refreshToken });
}
