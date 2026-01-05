"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import type { AnalysisRequest } from "@/types";

interface RequestsResponse {
  requests: AnalysisRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function RequestsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<RequestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/requests?${params}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = [
    { value: "", labelKey: "dashboard.totalRequests" },
    { value: "pending", labelKey: "status.pending" },
    { value: "in_progress", labelKey: "status.in_progress" },
    { value: "completed", labelKey: "status.completed" },
  ];

  const formatDate = (date: Date | string) => {
    const localeMap: Record<string, string> = { ko: "ko-KR", th: "th-TH", en: "en-US" };
    return new Date(date).toLocaleDateString(localeMap[locale] || "en-US", { calendar: "gregory" });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed": return "badge badge-completed";
      case "in_progress": return "badge badge-in-progress";
      case "pending": return "badge badge-pending";
      default: return "badge badge-cancelled";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-[900] tracking-tight text-primary">{t("requests.title")}</h1>
        <Link
          href="/requests/new"
          className="btn-accent text-sm"
        >
          {t("requests.newRequest")}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => {
              setStatusFilter(status.value);
              setPage(1);
            }}
            className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 ${
              statusFilter === status.value
                ? "bg-primary text-white shadow-md"
                : "bg-white text-slate-500 border border-slate-200 hover:border-primary hover:text-primary"
            }`}
          >
            {t(status.labelKey)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
          </div>
        ) : !data?.requests.length ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm italic uppercase tracking-wider">{t("requests.noRequests")}</p>
            <Link href="/requests/new" className="inline-block mt-4 text-accent hover:text-accent-dark font-bold text-sm uppercase tracking-wider">
              {t("requests.createFirst")}
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left py-4 px-6">{t("requests.requestTitle")}</th>
                    <th className="text-left py-4 px-6">{t("requests.memo")}</th>
                    <th className="text-left py-4 px-6">{t("requests.requester")}</th>
                    <th className="text-left py-4 px-6">{t("requests.files")}</th>
                    <th className="text-left py-4 px-6">{t("requests.status")}</th>
                    <th className="text-left py-4 px-6">{t("requests.requestDate")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.requests.map((request) => (
                    <tr key={request.id} className="table-row">
                      <td className="py-4 px-6">
                        <Link
                          href={`/requests/${request.id}`}
                          className="font-bold text-slate-800 hover:text-primary transition-colors"
                        >
                          {request.title}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500 max-w-[200px] truncate">
                        {request.memo || "-"}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {request.user?.name || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-bold">
                          {request.files?.length || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={getStatusBadgeClass(request.status)}>
                          {t(`status.${request.status}`)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">
                        {formatDate(request.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-6 border-t border-slate-100">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {t("common.back")}
                </button>
                <span className="text-sm font-bold text-slate-600">
                  {page} / {data.pagination.totalPages}
                </span>
                <button
                  disabled={page === data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {t("common.next")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
