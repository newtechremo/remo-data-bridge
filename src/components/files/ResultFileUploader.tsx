"use client";

import { useState, useRef } from "react";
import Button from "@/components/ui/Button";
import { formatFileSize } from "@/lib/utils";

interface ResultFileUploaderProps {
  onFileUploaded: (url: string) => void;
  currentUrl?: string;
  label?: string;
}

export default function ResultFileUploader({
  onFileUploaded,
  currentUrl,
  label = "결과 파일",
}: ResultFileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(currentUrl || "");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string> => {
    const presignedRes = await fetch("/api/upload/presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    });

    if (!presignedRes.ok) {
      throw new Error("Failed to get upload URL");
    }

    const { presignedUrl, url } = await presignedRes.json();

    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload file");
    }

    return url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);

    try {
      const url = await uploadFile(file);
      setUploadedUrl(url);
      onFileUploaded(url);
    } catch (error) {
      console.error("Upload error:", error);
      alert("파일 업로드에 실패했습니다");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedUrl("");
    setFileName("");
    onFileUploaded("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleView = async () => {
    if (!uploadedUrl) return;

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Url: uploadedUrl }),
      });

      if (!res.ok) throw new Error("Failed to get download URL");

      const { downloadUrl } = await res.json();
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error(error);
      alert("다운로드 URL을 가져오는데 실패했습니다");
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {uploadedUrl ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-0">
            <button
              onClick={handleView}
              className="text-sm text-blue-600 hover:underline truncate block text-left"
            >
              {fileName || "업로드된 파일"}
            </button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleView}
            >
              보기
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              삭제
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="result-file-input"
          />
          <Button
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            isLoading={uploading}
            disabled={uploading}
          >
            {uploading ? "업로드 중..." : "파일 선택"}
          </Button>
          {uploading && (
            <span className="text-sm text-gray-500">{fileName}</span>
          )}
        </div>
      )}
    </div>
  );
}
