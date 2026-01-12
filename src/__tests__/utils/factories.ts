// Test data factories
import { mockAdminUser, mockRegularUser } from "../mocks/auth";

// User factory
export const createMockUser = (overrides = {}) => ({
  id: `user-${Date.now()}`,
  email: `test-${Date.now()}@test.com`,
  name: "Test User",
  role: "user",
  passwordHash: "$2a$12$hashedpassword",
  memo: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Analysis request factory
export const createMockAnalysisRequest = (overrides = {}) => ({
  id: `request-${Date.now()}`,
  userId: mockRegularUser.id,
  title: "Test Analysis Request",
  memo: "Test memo",
  status: "pending",
  resultText: null,
  resultFileUrl: null,
  resultCreatedAt: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Analysis request with relations
export const createMockAnalysisRequestWithRelations = (overrides = {}) => ({
  ...createMockAnalysisRequest(),
  user: mockRegularUser,
  files: [],
  results: [],
  ...overrides,
});

// Uploaded file factory
export const createMockUploadedFile = (overrides = {}) => ({
  id: `file-${Date.now()}`,
  requestId: `request-${Date.now()}`,
  originalFilename: "test-file.pdf",
  s3Key: `uploads/${mockRegularUser.id}/${Date.now()}-test-file.pdf`,
  s3Url: `https://test-bucket.s3.ap-northeast-2.amazonaws.com/uploads/${mockRegularUser.id}/${Date.now()}-test-file.pdf`,
  fileSize: 1024,
  mimeType: "application/pdf",
  analysisResult: null,
  analysisResultFileUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Uploaded file with results
export const createMockUploadedFileWithResults = (overrides = {}) => ({
  ...createMockUploadedFile(),
  results: [],
  ...overrides,
});

// Analysis request result factory
export const createMockAnalysisRequestResult = (overrides = {}) => ({
  id: `result-${Date.now()}`,
  requestId: `request-${Date.now()}`,
  locale: "ko",
  text: "Test analysis result text",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Uploaded file result factory
export const createMockUploadedFileResult = (overrides = {}) => ({
  id: `file-result-${Date.now()}`,
  fileId: `file-${Date.now()}`,
  locale: "ko",
  text: "Test file analysis result text",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Pagination response factory
export const createMockPagination = (overrides = {}) => ({
  page: 1,
  limit: 10,
  total: 1,
  totalPages: 1,
  ...overrides,
});

// Multiple results for all locales
export const createMockMultilingualResults = (requestId: string) => [
  createMockAnalysisRequestResult({ requestId, locale: "ko", text: "한국어 결과" }),
  createMockAnalysisRequestResult({ requestId, locale: "en", text: "English result" }),
  createMockAnalysisRequestResult({ requestId, locale: "th", text: "ผลภาษาไทย" }),
];

// Multiple file results for all locales
export const createMockMultilingualFileResults = (fileId: string) => [
  createMockUploadedFileResult({ fileId, locale: "ko", text: "파일 분석 결과" }),
  createMockUploadedFileResult({ fileId, locale: "en", text: "File analysis result" }),
  createMockUploadedFileResult({ fileId, locale: "th", text: "ผลการวิเคราะห์ไฟล์" }),
];
