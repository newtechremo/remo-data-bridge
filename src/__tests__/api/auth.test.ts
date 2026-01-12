import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockAuth, setAdminSession, setUserSession, setNoSession, mockAdminUser, mockRegularUser } from "../mocks/auth";

describe("Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Session Management", () => {
    it("should return admin session when admin is logged in", async () => {
      setAdminSession();
      const session = await mockAuth();

      expect(session).not.toBeNull();
      expect(session?.user.role).toBe("admin");
      expect(session?.user.email).toBe(mockAdminUser.email);
    });

    it("should return user session when regular user is logged in", async () => {
      setUserSession();
      const session = await mockAuth();

      expect(session).not.toBeNull();
      expect(session?.user.role).toBe("user");
      expect(session?.user.email).toBe(mockRegularUser.email);
    });

    it("should return null when not logged in", async () => {
      setNoSession();
      const session = await mockAuth();

      expect(session).toBeNull();
    });
  });

  describe("Authorization Checks", () => {
    it("admin user should have admin role", async () => {
      setAdminSession();
      const session = await mockAuth();

      expect(session?.user.role).toBe("admin");
    });

    it("regular user should not have admin role", async () => {
      setUserSession();
      const session = await mockAuth();

      expect(session?.user.role).not.toBe("admin");
      expect(session?.user.role).toBe("user");
    });

    it("session should contain user id", async () => {
      setUserSession();
      const session = await mockAuth();

      expect(session?.user.id).toBeDefined();
      expect(session?.user.id).toBe(mockRegularUser.id);
    });
  });
});
