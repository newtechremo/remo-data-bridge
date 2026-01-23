"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL 파라미터에서 상태 읽기
  const page = parseInt(searchParams.get("page") || "1", 10);
  const statusFilter = searchParams.get("status") || "";
  const showDeleted = searchParams.get("deleted") === "true";

  const [data, setData] = useState<RequestsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // URL 파라미터 업데이트 함수
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || (key === "page" && value === "1") || (key === "deleted" && value === "false")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, showDeleted]);

  // 현재 목록 URL을 세션 스토리지에 저장 (상세에서 돌아올 때 사용)
  useEffect(() => {
    const currentUrl = window.location.href;
    sessionStorage.setItem("requestListUrl", currentUrl);
  }, [page, statusFilter, showDeleted]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter) params.append("status", statusFilter);
      if (showDeleted) params.append("deleted", "true");

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

  const handleRestore = async (id: string) => {
    if (!confirm(t("requests.confirmRestore"))) return;

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });

      if (res.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error("Failed to restore request:", error);
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
        {/* Active/Deleted Toggle for Admin */}
        {isAdmin && (
          <div className="flex items-center gap-1 mr-4 border-r border-slate-200 pr-4">
            <button
              onClick={() => updateParams({ deleted: "false", page: "1" })}
              className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 ${
                !showDeleted
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-primary hover:text-primary"
              }`}
            >
              {t("requests.active")}
            </button>
            <button
              onClick={() => updateParams({ deleted: "true", status: null, page: "1" })}
              className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 ${
                showDeleted
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-red-500 hover:text-red-500"
              }`}
            >
              {t("requests.deleted")}
            </button>
          </div>
        )}

        {/* Status Filters */}
        {!showDeleted && statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => updateParams({ status: status.value || null, page: "1" })}
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
                    <th className="text-left py-4 px-6">{showDeleted ? t("requests.deletedDate") : t("requests.requestDate")}</th>
                    {showDeleted && <th className="text-left py-4 px-6">{t("requests.actions")}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.requests.map((request) => (
                    <tr key={request.id} className={`table-row ${showDeleted ? "opacity-60" : ""}`}>
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
                        {showDeleted && request.deletedAt
                          ? formatDate(request.deletedAt)
                          : formatDate(request.createdAt)}
                      </td>
                      {showDeleted && (
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleRestore(request.id)}
                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                          >
                            {t("requests.restore")}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-6 border-t border-slate-100">
                <button
                  disabled={page === 1}
                  onClick={() => updateParams({ page: String(page - 1) })}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {t("common.back")}
                </button>
                <span className="text-sm font-bold text-slate-600">
                  {page} / {data.pagination.totalPages}
                </span>
                <button
                  disabled={page === data.pagination.totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
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
