export type UserRole = "admin" | "user";

export type RequestStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type Locale = "ko" | "en" | "th";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// 다국어 결과 타입
export interface AnalysisRequestResult {
  id: string;
  requestId: string;
  locale: Locale;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadedFileResult {
  id: string;
  fileId: string;
  locale: Locale;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadedFile {
  id: string;
  requestId: string;
  originalFilename: string;
  s3Key: string;
  s3Url: string;
  fileSize: number;
  mimeType: string | null;
  analysisResult: string | null; // deprecated
  analysisResultFileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  results?: UploadedFileResult[];
}

export interface AnalysisRequest {
  id: string;
  userId: string;
  title: string;
  memo: string | null;
  status: RequestStatus;
  resultText: string | null; // deprecated
  resultFileUrl: string | null;
  resultCreatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  user?: User;
  files?: UploadedFile[];
  results?: AnalysisRequestResult[];
  // 관리자용 네비게이션
  prevId?: string | null;
  nextId?: string | null;
}

// 다국어 결과 입력용 타입
export interface MultiLangResult {
  ko?: string;
  en?: string;
  th?: string;
}

export interface FileUploadInfo {
  originalFilename: string;
  s3Key: string;
  s3Url: string;
  fileSize: number;
  mimeType?: string;
}
