import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import * as userService from "../api/userService";
import type { User } from "../types";
import PageTransition from "../components/ui/PageTransition";
import { cn } from "../utils/cn";

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "VIEWER" as "ADMIN" | "VIEWER",
  });

  const fetchUsers = useCallback(async () => {
    const { users: data } = await userService.getUsers();
    setUsers(data);
  }, []);

  useEffect(() => {
    void fetchUsers()
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setLoading(false));
  }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await userService.createUser(form);
      toast.success("User created.");
      setForm({ name: "", email: "", password: "", role: "VIEWER" });
      await fetchUsers();
    } catch {
      toast.error("Failed to create user.");
    }
  }

  async function toggleActive(user: User) {
    try {
      await userService.updateUser(user.id, { isActive: !user.isActive });
      await fetchUsers();
    } catch {
      toast.error("Failed to update user.");
    }
  }

  async function toggleRole(user: User) {
    const nextRole = user.role === "ADMIN" ? "VIEWER" : "ADMIN";
    try {
      await userService.updateUser(user.id, { role: nextRole });
      await fetchUsers();
    } catch {
      toast.error("Failed to update role.");
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <p className="text-text-secondary">{t("common.loading")}</p>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("users.title")}</h1>

      <form
        onSubmit={handleCreate}
        className="glass rounded-xl border border-glass-border p-4 grid gap-3 md:grid-cols-5"
      >
        <input
          required
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Name"
          className="h-10 rounded-lg bg-bg-elevated border border-glass-border px-3 text-sm"
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder={t("auth.email")}
          className="h-10 rounded-lg bg-bg-elevated border border-glass-border px-3 text-sm"
        />
        <input
          required
          minLength={6}
          type="password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          placeholder={t("auth.password")}
          className="h-10 rounded-lg bg-bg-elevated border border-glass-border px-3 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              role: e.target.value as "ADMIN" | "VIEWER",
            }))
          }
          className="h-10 rounded-lg bg-bg-elevated border border-glass-border px-3 text-sm"
        >
          <option value="VIEWER">VIEWER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-accent-blue text-white text-sm font-medium"
        >
          {t("users.createUser")}
        </button>
      </form>

      <div className="glass rounded-xl border border-glass-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated/60 text-text-secondary">
            <tr>
              <th className="px-4 py-3 text-left">{t("auth.email")}</th>
              <th className="px-4 py-3 text-left">{t("users.role")}</th>
              <th className="px-4 py-3 text-left">{t("users.status")}</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-glass-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-text-muted text-xs">{user.email}</div>
                </td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                      user.isActive
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                    )}
                  >
                    {user.isActive ? t("users.active") : t("users.inactive")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => void toggleRole(user)}
                    className="text-xs text-accent-blue hover:underline"
                  >
                    Toggle role
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(user)}
                    className="text-xs text-warning hover:underline"
                  >
                    Toggle status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageTransition>
  );
}
