"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ResultFileUploader from "@/components/files/ResultFileUploader";
import {
  formatFileSize,
  getStatusColor,
} from "@/lib/utils";
import type { AnalysisRequest } from "@/types";

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  const [request, setRequest] = useState<AnalysisRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [resultText, setResultText] = useState("");
  const [resultFileUrl, setResultFileUrl] = useState("");
  const [fileResults, setFileResults] = useState<Record<string, string>>({});
  const [fileResultFileUrls, setFileResultFileUrls] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US");
  };

  useEffect(() => {
    fetchRequest();
  }, [params.id]);

  // Get presigned download URL and open in new tab
  const handleDownload = async (s3Url: string) => {
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Url }),
      });

      if (!res.ok) throw new Error("Failed to get download URL");

      const { downloadUrl } = await res.json();
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error(error);
      toast.error(t("files.downloadError"));
    }
  };

  // Get presigned download URL for uploaded file by ID
  const handleFileDownload = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}/download`);

      if (!res.ok) throw new Error("Failed to get download URL");

      const { downloadUrl } = await res.json();
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error(error);
      toast.error(t("files.downloadError"));
    }
  };

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch request");
      const data = await res.json();
      setRequest(data);
      setResultText(data.resultText || "");
      setResultFileUrl(data.resultFileUrl || "");

      const initialFileResults: Record<string, string> = {};
      const initialFileResultFileUrls: Record<string, string> = {};
      data.files?.forEach((file: { id: string; analysisResult: string | null; analysisResultFileUrl: string | null }) => {
        initialFileResults[file.id] = file.analysisResult || "";
        initialFileResultFileUrls[file.id] = file.analysisResultFileUrl || "";
      });
      setFileResults(initialFileResults);
      setFileResultFileUrls(initialFileResultFileUrls);
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResult = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${params.id}/result`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultText, resultFileUrl }),
      });

      if (!res.ok) throw new Error("Failed to save result");

      toast.success(t("requests.result.savedMessage"));
      fetchRequest();
    } catch (error) {
      console.error(error);
      toast.error(t("requests.result.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFileResult = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}/result`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisResult: fileResults[fileId],
          analysisResultFileUrl: fileResultFileUrls[fileId],
        }),
      });

      if (!res.ok) throw new Error("Failed to save file result");

      toast.success(t("requests.result.fileSavedMessage"));
      fetchRequest();
    } catch (error) {
      console.error(error);
      toast.error(t("requests.result.saveError"));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("requests.detail.confirmDelete"))) return;

    try {
      const res = await fetch(`/api/requests/${params.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete request");

      toast.success(t("common.success"));
      router.push("/requests");
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("common.noData")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            {t("requests.detail.backToList")}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            {t("common.delete")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("requests.detail.info")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">{t("requests.status")}</p>
              <span
                className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                  request.status
                )}`}
              >
                {t(`status.${request.status}`)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("requests.requester")}</p>
              <p className="mt-1 font-medium">{request.user?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("requests.requestDate")}</p>
              <p className="mt-1">{formatDate(request.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("requests.files")}</p>
              <p className="mt-1">{request.files?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("requests.detail.uploadedFiles")}</CardTitle>
        </CardHeader>
        <CardContent>
          {request.files?.length === 0 ? (
            <p className="text-gray-500">{t("requests.detail.noFiles")}</p>
          ) : (
            <div className="space-y-4">
              {request.files?.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <button
                        onClick={() => handleFileDownload(file.id)}
                        className="font-medium text-blue-600 hover:underline text-left"
                      >
                        {file.originalFilename}
                      </button>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatFileSize(file.fileSize)}
                        {file.mimeType && ` · ${file.mimeType}`}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleFileDownload(file.id)}
                    >{t("common.download")}</Button>
                  </div>

                  {isAdmin && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("requests.result.fileResultText")}
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          value={fileResults[file.id] || ""}
                          onChange={(e) =>
                            setFileResults((prev) => ({
                              ...prev,
                              [file.id]: e.target.value,
                            }))
                          }
                          placeholder={t("requests.result.fileResultPlaceholder")}
                        />
                      </div>
                      <ResultFileUploader
                        label={t("requests.result.fileResultFile")}
                        currentUrl={fileResultFileUrls[file.id]}
                        onFileUploaded={(url) =>
                          setFileResultFileUrls((prev) => ({
                            ...prev,
                            [file.id]: url,
                          }))
                        }
                      />
                      {fileResultFileUrls[file.id] && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <span className="text-sm text-green-700">{t("requests.result.resultFile")}:</span>
                          <button
                            onClick={() => handleDownload(fileResultFileUrls[file.id])}
                            className="text-sm text-blue-600 hover:underline"
                          >{t("files.downloadView")}</button>
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleSaveFileResult(file.id)}
                      >{t("common.save")}</Button>
                    </div>
                  )}

                  {!isAdmin && (file.analysisResult || file.analysisResultFileUrl) && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-gray-700">{t("requests.detail.analysisResult")}</p>
                      {file.analysisResult && (
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {file.analysisResult}
                        </p>
                      )}
                      {file.analysisResultFileUrl && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{t("requests.result.resultFile")}:</span>
                          <button
                            onClick={() => handleDownload(file.analysisResultFileUrl!)}
                            className="text-sm text-blue-600 hover:underline"
                          >{t("files.downloadView")}</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("requests.detail.analysisResult")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("requests.result.textLabel")}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder={t("requests.result.textPlaceholder")}
                />
              </div>
              <ResultFileUploader
                label={t("requests.result.fileLabel")}
                currentUrl={resultFileUrl}
                onFileUploaded={(url) => setResultFileUrl(url)}
              />
              <Button
                onClick={handleSaveResult}
                isLoading={isSubmitting}
                disabled={!resultText.trim()}
              >{t("requests.result.saveButton")}</Button>
            </div>
          ) : request.resultText ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">{t("requests.detail.analysisResult")}</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{request.resultText}</p>
                </div>
              </div>
              {request.resultFileUrl && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">{t("requests.result.resultFile")}</p>
                  <button
                    onClick={() => handleDownload(request.resultFileUrl!)}
                    className="text-blue-600 hover:underline"
                  >{t("common.download")}</button>
                </div>
              )}
              {request.resultCreatedAt && (
                <p className="text-sm text-gray-500">
                  {t("requests.detail.resultDate")}: {formatDate(request.resultCreatedAt)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">{t("requests.detail.noResult")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
