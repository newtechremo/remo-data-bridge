"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FileUploader from "@/components/files/FileUploader";
import type { FileUploadInfo } from "@/types";

export default function NewRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<FileUploadInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFilesUploaded = (newFiles: FileUploadInfo[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }

    if (files.length === 0) {
      toast.error("파일을 업로드해주세요");
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
        throw new Error(error.error || "요청 생성에 실패했습니다");
      }

      const request = await res.json();
      toast.success("분석 요청이 생성되었습니다");
      router.push(`/requests/${request.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "요청 생성에 실패했습니다"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">새 분석 요청</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>요청 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              id="title"
              label="요청 제목"
              placeholder="분석 요청 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                파일 업로드
              </label>
              <FileUploader onFilesUploaded={handleFilesUploaded} />
            </div>

            {files.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업로드된 파일 ({files.length}개)
                </label>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.originalFilename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!title.trim() || files.length === 0}
              >
                요청 생성
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
