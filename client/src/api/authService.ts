import api from "./axios";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
  User,
} from "../types";

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function getAuthConfig(): Promise<{ registrationAllowed: boolean }> {
  const { data } = await api.get<{ registrationAllowed: boolean }>("/auth/config");
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function getMe(): Promise<{ user: User }> {
  const { data } = await api.get<{ user: User }>("/auth/me");
  return data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<{ user: User }> {
  const { data } = await api.patch<{ user: User }>("/auth/profile", payload);
  return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>("/auth/password", payload);
  return data;
}
