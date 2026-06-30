import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import * as auditService from "../api/auditService";
import type { AuditLogEntry } from "../api/auditService";
import PageTransition from "../components/ui/PageTransition";

export default function AuditPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void auditService
      .getAuditLogs()
      .then((res) => setLogs(res.logs))
      .catch(() => toast.error("Failed to load audit logs."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <p className="text-text-secondary">{t("common.loading")}</p>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("audit.title")}</h1>

      <div className="glass rounded-xl border border-glass-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated/60 text-text-secondary">
            <tr>
              <th className="px-4 py-3 text-left">{t("audit.when")}</th>
              <th className="px-4 py-3 text-left">{t("audit.actor")}</th>
              <th className="px-4 py-3 text-left">{t("audit.action")}</th>
              <th className="px-4 py-3 text-left">{t("audit.entity")}</th>
              <th className="px-4 py-3 text-left">{t("audit.summary")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-glass-border align-top">
                <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div>{log.actor.name}</div>
                  <div className="text-xs text-text-muted">{log.actor.email}</div>
                </td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3">
                  {log.entityType}
                  <div className="text-xs text-text-muted">{log.entityId}</div>
                </td>
                <td className="px-4 py-3">{log.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageTransition>
  );
}
