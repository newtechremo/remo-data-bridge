"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getStatusColor } from "@/lib/utils";
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
    return new Date(date).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("requests.title")}</h1>
        <Link href="/requests/new">
          <Button>{t("requests.newRequest")}</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("nav.requests")}</CardTitle>
            <div className="flex gap-2">
              {statuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    setStatusFilter(status.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    statusFilter === status.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t(status.labelKey)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">{t("common.loading")}</div>
          ) : !data?.requests.length ? (
            <div className="text-center py-8 text-gray-500">
              {t("requests.noRequests")}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        {t("requests.requestTitle")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        {t("requests.requester")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        {t("requests.files")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        {t("requests.status")}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        {t("requests.requestDate")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.requests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <Link
                            href={`/requests/${request.id}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {request.title}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {request.user?.name || "-"}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {request.files?.length || 0}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {t(`status.${request.status}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(request.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    {t("common.back")}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {page} / {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === data.pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {t("dashboard.viewAll")}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
