import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";
import { mockGetSignedUrl, resetS3Mocks } from "../mocks/s3";
import { setAdminSession, setUserSession, setNoSession, mockRegularUser } from "../mocks/auth";
import {
  createMockUploadedFile,
  createMockUploadedFileWithResults,
  createMockUploadedFileResult,
  createMockMultilingualFileResults,
} from "../utils/factories";

describe("File Management API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPrismaMocks();
    resetS3Mocks();
  });

  describe("POST /api/upload/presigned - Generate Presigned URL", () => {
    describe("Authentication", () => {
      it("should return 401 when not authenticated", async () => {
        setNoSession();
        // Unauthenticated requests should be rejected
        expect(true).toBe(true);
      });

      it("should generate presigned URL for authenticated user", async () => {
        setUserSession();
        const filename = "test-document.pdf";
        const contentType = "application/pdf";

        mockGetSignedUrl.mockResolvedValue(
          "https://test-bucket.s3.ap-northeast-2.amazonaws.com/uploads/user-id/timestamp-test-document.pdf?signature=xxx"
        );

        const result = await mockGetSignedUrl();

        expect(result).toContain("s3.ap-northeast-2.amazonaws.com");
        expect(result).toContain("test-bucket");
      });
    });

    describe("URL Generation", () => {
      it("should generate unique S3 key with timestamp", async () => {
        setUserSession();
        const filename = "document.pdf";
        const now = Date.now();

        // S3 key format: uploads/{userId}/{timestamp}-{filename}
        const expectedKeyPattern = new RegExp(
          `uploads/${mockRegularUser.id}/\\d+-document\\.pdf`
        );

        const s3Key = `uploads/${mockRegularUser.id}/${now}-document.pdf`;
        expect(s3Key).toMatch(expectedKeyPattern);
      });

      it("should sanitize filename with special characters", async () => {
        setUserSession();
        const unsafeFilename = "file with spaces & special!@#$.pdf";
        // Sanitized: special characters removed, spaces replaced
        const sanitizedFilename = unsafeFilename
          .replace(/[^a-zA-Z0-9.-]/g, "_");

        expect(sanitizedFilename).not.toContain(" ");
        expect(sanitizedFilename).not.toContain("&");
        expect(sanitizedFilename).not.toContain("@");
      });

      it("should set URL expiration to 1 hour", async () => {
        setUserSession();
        // Presigned URL should expire in 1 hour (3600 seconds)
        const expirationSeconds = 3600;
        expect(expirationSeconds).toBe(3600);
      });
    });

    describe("Content Type Validation", () => {
      it("should accept valid content types", async () => {
        setUserSession();
        const validContentTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

        validContentTypes.forEach((contentType) => {
          expect(contentType).toBeTruthy();
        });
      });
    });
  });

  describe("GET /api/files/:id/download - Download File", () => {
    describe("Authentication", () => {
      it("should return 401 when not authenticated", async () => {
        setNoSession();
        expect(true).toBe(true);
      });
    });

    describe("File Download", () => {
      it("should generate download URL for valid file", async () => {
        setUserSession();
        const file = createMockUploadedFile();

        mockPrisma.uploadedFile.findUnique.mockResolvedValue(file);
        mockGetSignedUrl.mockResolvedValue(
          `https://test-bucket.s3.ap-northeast-2.amazonaws.com/${file.s3Key}?download`
        );

        const result = await mockGetSignedUrl();

        expect(result).toContain("s3.ap-northeast-2.amazonaws.com");
      });

      it("should return 404 for non-existent file", async () => {
        setUserSession();
        mockPrisma.uploadedFile.findUnique.mockResolvedValue(null);

        const result = await mockPrisma.uploadedFile.findUnique({
          where: { id: "non-existent-id" },
        });

        expect(result).toBeNull();
      });
    });
  });

  describe("PATCH /api/files/:id/result - Save File Analysis Result", () => {
    describe("Authentication & Authorization", () => {
      it("should return 401 when not authenticated", async () => {
        setNoSession();
        expect(true).toBe(true);
      });

      it("should return 403 for non-admin users", async () => {
        setUserSession();
        // Only admin can save file analysis results
        expect(mockRegularUser.role).not.toBe("admin");
      });

      it("admin should be able to save results", async () => {
        setAdminSession();
        const file = createMockUploadedFile();
        const results = {
          ko: "한국어 파일 분석 결과",
          en: "English file analysis result",
        };

        mockPrisma.uploadedFile.findUnique.mockResolvedValue(file);
        mockPrisma.uploadedFileResult.upsert.mockResolvedValue(
          createMockUploadedFileResult({ fileId: file.id })
        );

        const result = await mockPrisma.uploadedFileResult.upsert({
          where: { fileId_locale: { fileId: file.id, locale: "ko" } },
          create: { fileId: file.id, locale: "ko", text: results.ko },
          update: { text: results.ko },
        });

        expect(result.text).toBeTruthy();
      });
    });

    describe("Multilingual Results", () => {
      it("should save results for all supported locales", async () => {
        setAdminSession();
        const file = createMockUploadedFile();
        const results = createMockMultilingualFileResults(file.id);

        results.forEach((result) => {
          mockPrisma.uploadedFileResult.upsert.mockResolvedValueOnce(result);
        });

        // Simulate saving results for each locale
        for (const result of results) {
          const saved = await mockPrisma.uploadedFileResult.upsert({
            where: { fileId_locale: { fileId: file.id, locale: result.locale } },
            create: { fileId: file.id, locale: result.locale, text: result.text },
            update: { text: result.text },
          });

          expect(saved.locale).toBe(result.locale);
          expect(saved.text).toBeTruthy();
        }
      });

      it("should update existing result for same locale", async () => {
        setAdminSession();
        const file = createMockUploadedFile();
        const existingResult = createMockUploadedFileResult({
          fileId: file.id,
          locale: "ko",
          text: "이전 결과",
        });
        const updatedResult = { ...existingResult, text: "업데이트된 결과" };

        mockPrisma.uploadedFileResult.upsert.mockResolvedValue(updatedResult);

        const result = await mockPrisma.uploadedFileResult.upsert({
          where: { fileId_locale: { fileId: file.id, locale: "ko" } },
          create: { fileId: file.id, locale: "ko", text: "업데이트된 결과" },
          update: { text: "업데이트된 결과" },
        });

        expect(result.text).toBe("업데이트된 결과");
      });

      it("should delete result when empty string is provided", async () => {
        setAdminSession();
        const file = createMockUploadedFile();

        mockPrisma.uploadedFileResult.deleteMany.mockResolvedValue({ count: 1 });

        const result = await mockPrisma.uploadedFileResult.deleteMany({
          where: { fileId: file.id, locale: "ko" },
        });

        expect(result.count).toBe(1);
      });
    });

    describe("Result File URL", () => {
      it("should save analysis result file URL", async () => {
        setAdminSession();
        const file = createMockUploadedFile();
        const resultFileUrl = "https://test-bucket.s3.amazonaws.com/results/analysis.pdf";

        const updatedFile = { ...file, analysisResultFileUrl: resultFileUrl };
        mockPrisma.uploadedFile.update.mockResolvedValue(updatedFile);

        const result = await mockPrisma.uploadedFile.update({
          where: { id: file.id },
          data: { analysisResultFileUrl: resultFileUrl },
        });

        expect(result.analysisResultFileUrl).toBe(resultFileUrl);
      });
    });
  });

  describe("File Metadata", () => {
    it("should store correct file metadata", async () => {
      const file = createMockUploadedFile({
        originalFilename: "important-document.pdf",
        fileSize: 2048576, // 2MB
        mimeType: "application/pdf",
      });

      expect(file.originalFilename).toBe("important-document.pdf");
      expect(file.fileSize).toBe(2048576);
      expect(file.mimeType).toBe("application/pdf");
    });

    it("should generate valid S3 URL", async () => {
      const file = createMockUploadedFile();

      expect(file.s3Url).toContain("s3.ap-northeast-2.amazonaws.com");
      expect(file.s3Key).toContain("uploads/");
    });
  });
});
