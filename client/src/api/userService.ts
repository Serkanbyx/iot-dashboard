import api from "./axios";
import type { User } from "../types";

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "VIEWER";
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: "ADMIN" | "VIEWER";
  isActive?: boolean;
}

export async function getUsers(): Promise<{ users: User[] }> {
  const { data } = await api.get<{ users: User[] }>("/users");
  return data;
}

export async function createUser(
  payload: CreateUserPayload
): Promise<{ user: User }> {
  const { data } = await api.post<{ user: User }>("/users", payload);
  return data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<{ user: User }> {
  const { data } = await api.patch<{ user: User }>(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/users/${id}`);
  return data;
}
