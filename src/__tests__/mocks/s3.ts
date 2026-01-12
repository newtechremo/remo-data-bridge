import { vi } from "vitest";

// Mock S3 client functions
export const mockGetSignedUrl = vi.fn();
export const mockS3Send = vi.fn();

// Default mock implementations
mockGetSignedUrl.mockResolvedValue("https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-signed-url");

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({
    send: mockS3Send,
  })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

export const resetS3Mocks = () => {
  mockGetSignedUrl.mockReset();
  mockS3Send.mockReset();
  mockGetSignedUrl.mockResolvedValue("https://test-bucket.s3.ap-northeast-2.amazonaws.com/test-signed-url");
};
