import { beforeAll, afterAll, afterEach, vi } from "vitest";
import "@testing-library/dom";

// Mock NextAuth
vi.mock("next-auth", () => ({
  default: vi.fn(),
}));

// Mock environment variables
process.env.AUTH_SECRET = "test-secret-key-for-testing-purposes-only";
process.env.DATABASE_URL = "file:./test.db";
process.env.AWS_REGION = "ap-northeast-2";
process.env.AWS_ACCESS_KEY_ID = "test-access-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";
process.env.AWS_S3_BUCKET = "test-bucket";

// Global test lifecycle hooks
beforeAll(() => {
  console.log("Test suite starting...");
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  console.log("Test suite completed.");
});
