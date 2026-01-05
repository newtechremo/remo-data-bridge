export type UserRole = "admin" | "user";

export type RequestStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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
  analysisResult: string | null;
  analysisResultFileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisRequest {
  id: string;
  userId: string;
  title: string;
  memo: string | null;
  status: RequestStatus;
  resultText: string | null;
  resultFileUrl: string | null;
  resultCreatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  files?: UploadedFile[];
}

export interface FileUploadInfo {
  originalFilename: string;
  s3Key: string;
  s3Url: string;
  fileSize: number;
  mimeType?: string;
}
