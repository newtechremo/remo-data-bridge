"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import FileUploader from "@/components/files/FileUploader";
import ConsentModal from "@/components/ui/ConsentModal";
import type { FileUploadInfo } from "@/types";

export default function NewRequestPage() {
  const router = useRouter();
  const t = useTranslations();
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<FileUploadInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Check if user has already consented in this session
    const consented = sessionStorage.getItem("dataTransferConsent");
    if (consented === "true") {
      setHasConsented(true);
    } else {
      setShowConsent(true);
    }
    setIsChecking(false);
  }, []);

  const handleConsent = () => {
    sessionStorage.setItem("dataTransferConsent", "true");
    setShowConsent(false);
    setHasConsented(true);
  };

  const handleConsentClose = () => {
    router.back();
  };

  const handleFilesUploaded = (newFiles: FileUploadInfo[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t("requests.new.titleRequired"));
      return;
    }

    if (files.length === 0) {
      toast.error(t("requests.new.filesRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, files }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t("requests.new.errorMessage"));
      }

      const request = await res.json();
      toast.success(t("requests.new.successMessage"));
      router.push(`/requests/${request.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("requests.new.errorMessage")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Show loading while checking consent status
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <ConsentModal
        isOpen={showConsent}
        onClose={handleConsentClose}
        onConfirm={handleConsent}
      />

      <div className={`max-w-2xl mx-auto space-y-6 animate-fade-in ${!hasConsented && !showConsent ? "opacity-50 pointer-events-none" : ""}`}>
        <h1 className="text-3xl font-[900] tracking-tight text-primary">{t("requests.new.title")}</h1>

        {/* Security Notice */}
        <div className="bg-primary rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Security Directive
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                AES-256 military-grade encryption active. Your data is protected during transfer and storage.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-header-title">{t("requests.detail.info")}</h2>
            </div>
            <div className="card-body space-y-6">
              {/* Title Input */}
              <div>
                <label className="label-text block">{t("requests.new.titleLabel")}</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t("requests.new.titlePlaceholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="label-text block">{t("requests.new.filesLabel")}</label>
                <FileUploader onFilesUploaded={handleFilesUploaded} />
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div>
                  <label className="label-text block">
                    {t("files.uploadedFile")} ({files.length})
                  </label>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{file.originalFilename}</p>
                            <p className="text-xs text-slate-500">
                              {(file.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn-secondary flex-1"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || files.length === 0 || isSubmitting}
                  className={`flex-1 px-6 py-3 rounded-lg font-black text-sm uppercase tracking-widest transition-all duration-200 ${
                    !title.trim() || files.length === 0 || isSubmitting
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/20 active:scale-[0.99]"
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t("requests.new.submitting")}
                    </span>
                  ) : (
                    t("requests.new.submit")
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
