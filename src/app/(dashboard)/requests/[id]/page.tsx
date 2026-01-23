"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ResultFileUploader from "@/components/files/ResultFileUploader";
import RequestNavigation from "@/components/requests/RequestNavigation";
import {
  formatFileSize,
  getStatusColor,
} from "@/lib/utils";
import type { AnalysisRequest, Locale, MultiLangResult, AnalysisRequestResult, UploadedFileResult } from "@/types";

const LOCALES: Locale[] = ["ko", "en", "th"];
const LOCALE_NAMES: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  th: "ไทย",
};

// 다국어 결과에서 현재 로케일에 맞는 텍스트 가져오기 (없으면 영어 기본)
function getLocalizedResult(
  results: AnalysisRequestResult[] | UploadedFileResult[] | undefined,
  currentLocale: string
): string | null {
  if (!results || results.length === 0) return null;

  // 현재 로케일의 결과 찾기
  const localeResult = results.find((r) => r.locale === currentLocale);
  if (localeResult) return localeResult.text;

  // 없으면 영어 기본
  const enResult = results.find((r) => r.locale === "en");
  if (enResult) return enResult.text;

  // 영어도 없으면 첫 번째 결과
  return results[0]?.text || null;
}

// 다국어 결과 배열을 MultiLangResult 객체로 변환
function resultsToMultiLang(
  results: AnalysisRequestResult[] | UploadedFileResult[] | undefined
): MultiLangResult {
  const multiLang: MultiLangResult = {};
  results?.forEach((r) => {
    multiLang[r.locale as Locale] = r.text;
  });
  return multiLang;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  const [request, setRequest] = useState<AnalysisRequest | null>(null);
  const [loading, setLoading] = useState(true);

  // 다국어 결과 상태
  const [resultTexts, setResultTexts] = useState<MultiLangResult>({});
  const [resultFileUrl, setResultFileUrl] = useState("");
  const [fileResults, setFileResults] = useState<Record<string, MultiLangResult>>({});
  const [fileResultFileUrls, setFileResultFileUrls] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 현재 선택된 언어 탭
  const [activeTab, setActiveTab] = useState<Locale>("ko");
  // 파일별 언어 탭 상태
  const [fileActiveTabs, setFileActiveTabs] = useState<Record<string, Locale>>({});

  const isAdmin = session?.user?.role === "admin";

  const formatDate = (date: Date | string) => {
    const localeMap: Record<string, string> = { ko: "ko-KR", th: "th-TH", en: "en-US" };
    return new Date(date).toLocaleDateString(localeMap[locale] || "en-US", { calendar: "gregory" });
  };

  useEffect(() => {
    fetchRequest();
  }, [params.id]);

  // Get presigned download URL and open in new tab
  const handleDownload = async (s3Url: string) => {
    try {
      const urlParts = s3Url.split("/");
      const rawFilename = urlParts[urlParts.length - 1];
      const filename = decodeURIComponent(rawFilename.replace(/^\d+-/, ""));

      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Url, filename }),
      });

      if (!res.ok) throw new Error("Failed to get download URL");

      const { downloadUrl } = await res.json();
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error(error);
      toast.error(t("files.downloadError"));
    }
  };

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
      const data: AnalysisRequest = await res.json();
      setRequest(data);

      // 다국어 결과 초기화
      setResultTexts(resultsToMultiLang(data.results));
      setResultFileUrl(data.resultFileUrl || "");

      const initialFileResults: Record<string, MultiLangResult> = {};
      const initialFileResultFileUrls: Record<string, string> = {};
      data.files?.forEach((file) => {
        initialFileResults[file.id] = resultsToMultiLang(file.results);
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
        body: JSON.stringify({
          results: resultTexts,
          resultFileUrl,
        }),
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
          results: fileResults[fileId],
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

  // 언어 탭 컴포넌트
  const LanguageTabs = ({ className = "" }: { className?: string }) => (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => setActiveTab(loc)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === loc
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          {LOCALE_NAMES[loc]}
          {resultTexts[loc] && <span className="ml-1 text-green-500">*</span>}
        </button>
      ))}
    </div>
  );

  // 파일별 언어 탭
  const FileLanguageTabs = ({
    fileId,
    activeFileTab,
    setActiveFileTab
  }: {
    fileId: string;
    activeFileTab: Locale;
    setActiveFileTab: (loc: Locale) => void;
  }) => (
    <div className="flex border-b border-gray-200 mb-2">
      {LOCALES.map((loc) => (
        <button
          key={loc}
          onClick={() => setActiveFileTab(loc)}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
            activeFileTab === loc
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {LOCALE_NAMES[loc]}
          {fileResults[fileId]?.[loc] && <span className="ml-1 text-green-500">*</span>}
        </button>
      ))}
    </div>
  );

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
    <>
      {/* 관리자용 이전/다음 요청 네비게이션 */}
      {isAdmin && (
        <RequestNavigation prevId={request.prevId} nextId={request.nextId} />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => {
            const listUrl = sessionStorage.getItem("requestListUrl") || "/requests";
            router.push(listUrl);
          }}>
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
          {request.memo && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">{t("requests.memo")}</p>
              <p className="mt-1 whitespace-pre-wrap text-gray-700">{request.memo}</p>
            </div>
          )}
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
              {request.files?.map((file) => {
                const activeFileTab = fileActiveTabs[file.id] || "ko";
                const setActiveFileTab = (loc: Locale) => {
                  setFileActiveTabs((prev) => ({ ...prev, [file.id]: loc }));
                };
                const localizedFileResult = getLocalizedResult(file.results, locale);

                return (
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
                        <FileLanguageTabs
                          fileId={file.id}
                          activeFileTab={activeFileTab}
                          setActiveFileTab={setActiveFileTab}
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("requests.result.fileResultText")} ({LOCALE_NAMES[activeFileTab]})
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            value={fileResults[file.id]?.[activeFileTab] || ""}
                            onChange={(e) =>
                              setFileResults((prev) => ({
                                ...prev,
                                [file.id]: {
                                  ...prev[file.id],
                                  [activeFileTab]: e.target.value,
                                },
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

                    {!isAdmin && (localizedFileResult || file.analysisResultFileUrl) && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
                        <p className="text-sm font-medium text-gray-700">{t("requests.detail.analysisResult")}</p>
                        {localizedFileResult && (
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {localizedFileResult}
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
                );
              })}
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
              <LanguageTabs />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("requests.result.textLabel")} ({LOCALE_NAMES[activeTab]})
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  value={resultTexts[activeTab] || ""}
                  onChange={(e) => setResultTexts((prev) => ({
                    ...prev,
                    [activeTab]: e.target.value,
                  }))}
                  placeholder={t("requests.result.textPlaceholder")}
                />
              </div>
              <div className="text-xs text-gray-500">
                {LOCALES.map((loc) => (
                  <span key={loc} className="mr-3">
                    {LOCALE_NAMES[loc]}: {resultTexts[loc] ? "O" : "-"}
                  </span>
                ))}
              </div>
              <ResultFileUploader
                label={t("requests.result.fileLabel")}
                currentUrl={resultFileUrl}
                onFileUploaded={(url) => setResultFileUrl(url)}
              />
              <Button
                onClick={handleSaveResult}
                isLoading={isSubmitting}
                disabled={!Object.values(resultTexts).some((v) => v?.trim())}
              >{t("requests.result.saveButton")}</Button>
            </div>
          ) : (
            (() => {
              const localizedResult = getLocalizedResult(request.results, locale);
              return localizedResult ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{t("requests.detail.analysisResult")}</p>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="whitespace-pre-wrap">{localizedResult}</p>
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
              );
            })()
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
