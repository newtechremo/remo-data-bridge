"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn, formatFileSize } from "@/lib/utils";
import Button from "@/components/ui/Button";
import type { FileUploadInfo } from "@/types";

interface FileUploaderProps {
  onFilesUploaded: (files: FileUploadInfo[]) => void;
  maxFiles?: number;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  uploadInfo?: FileUploadInfo;
  error?: string;
}

export default function FileUploader({
  onFilesUploaded,
  maxFiles = 10,
}: FileUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const uploadFile = async (file: File): Promise<FileUploadInfo> => {
    // Get presigned URL
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

    const { presignedUrl, key, url } = await presignedRes.json();

    // Upload to S3
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

    return {
      originalFilename: file.name,
      s3Key: key,
      s3Url: url,
      fileSize: file.size,
      mimeType: file.type,
    };
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      const uploadedInfos: FileUploadInfo[] = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const fileIndex = uploadingFiles.length + i;

        setUploadingFiles((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: "uploading" as const } : f
          )
        );

        try {
          const info = await uploadFile(file);
          uploadedInfos.push(info);

          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex
                ? { ...f, status: "done" as const, uploadInfo: info }
                : f
            )
          );
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex
                ? {
                    ...f,
                    status: "error" as const,
                    error: error instanceof Error ? error.message : "Upload failed",
                  }
                : f
            )
          );
        }
      }

      if (uploadedInfos.length > 0) {
        onFilesUploaded(uploadedInfos);
      }
    },
    [onFilesUploaded, uploadingFiles.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
  });

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer",
          "transition-colors duration-200",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        <div className="text-gray-500">
          <p className="text-lg mb-2">
            {isDragActive
              ? "파일을 여기에 놓으세요"
              : "파일을 드래그하거나 클릭하여 업로드"}
          </p>
          <p className="text-sm">최대 {maxFiles}개 파일</p>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                item.status === "error" ? "bg-red-50" : "bg-gray-50"
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(item.file.size)}
                  {item.status === "uploading" && " · 업로드 중..."}
                  {item.status === "done" && " · 완료"}
                  {item.status === "error" && ` · 오류: ${item.error}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.status === "uploading" && (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                )}
                {item.status === "done" && (
                  <span className="text-green-500">✓</span>
                )}
                {item.status === "error" && (
                  <span className="text-red-500">✗</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
