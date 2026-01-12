import { vi } from "vitest";

// Test users
export const mockAdminUser = {
  id: "admin-test-id",
  email: "admin@test.com",
  name: "Test Admin",
  role: "admin",
};

export const mockRegularUser = {
  id: "user-test-id",
  email: "user@test.com",
  name: "Test User",
  role: "user",
};

// Mock session
export const mockAdminSession = {
  user: mockAdminUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockUserSession = {
  user: mockRegularUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock auth function
export const mockAuth = vi.fn();

export const setMockSession = (session: typeof mockAdminSession | typeof mockUserSession | null) => {
  mockAuth.mockResolvedValue(session);
};

export const setAdminSession = () => setMockSession(mockAdminSession);
export const setUserSession = () => setMockSession(mockUserSession);
export const setNoSession = () => setMockSession(null);

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));
