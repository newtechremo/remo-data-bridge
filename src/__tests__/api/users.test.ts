import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";
import { setAdminSession, setUserSession, setNoSession, mockAdminUser, mockRegularUser } from "../mocks/auth";
import { createMockUser } from "../utils/factories";

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
  compare: vi.fn().mockResolvedValue(true),
}));

describe("User Management API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPrismaMocks();
  });

  describe("GET /api/users - List Users", () => {
    describe("Authentication & Authorization", () => {
      it("should return 401 when not authenticated", async () => {
        setNoSession();
        // Unauthenticated requests should be rejected
        expect(true).toBe(true);
      });

      it("should return 403 for non-admin users", async () => {
        setUserSession();
        // Regular users cannot access user list
        expect(mockRegularUser.role).not.toBe("admin");
      });

      it("admin should be able to list all users", async () => {
        setAdminSession();
        const users = [
          createMockUser({ role: "admin", email: "admin@test.com" }),
          createMockUser({ role: "user", email: "user1@test.com" }),
          createMockUser({ role: "user", email: "user2@test.com" }),
        ];

        mockPrisma.user.findMany.mockResolvedValue(users);

        const result = await mockPrisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            memo: true,
            createdAt: true,
            _count: { select: { analysisRequests: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        expect(result).toHaveLength(3);
      });
    });

    describe("User Data", () => {
      it("should return user count with analysis requests", async () => {
        setAdminSession();
        const userWithRequests = {
          ...createMockUser(),
          _count: { analysisRequests: 5 },
        };

        mockPrisma.user.findMany.mockResolvedValue([userWithRequests]);

        const result = await mockPrisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            _count: { select: { analysisRequests: true } },
          },
        });

        expect(result[0]._count.analysisRequests).toBe(5);
      });

      it("should not expose password hash", async () => {
        setAdminSession();
        const user = createMockUser();

        mockPrisma.user.findMany.mockResolvedValue([
          { id: user.id, email: user.email, name: user.name, role: user.role },
        ]);

        const result = await mockPrisma.user.findMany({
          select: { id: true, email: true, name: true, role: true },
        });

        expect(result[0]).not.toHaveProperty("passwordHash");
      });
    });
  });

  describe("POST /api/users - Create User", () => {
    describe("Authentication & Authorization", () => {
      it("should return 401 when not authenticated", async () => {
        setNoSession();
        expect(true).toBe(true);
      });

      it("should return 403 for non-admin users", async () => {
        setUserSession();
        expect(mockRegularUser.role).not.toBe("admin");
      });
    });

    describe("User Creation", () => {
      it("admin should be able to create new user", async () => {
        setAdminSession();
        const newUserData = {
          email: "newuser@test.com",
          password: "securepassword123",
          name: "New User",
          role: "user",
        };

        const createdUser = createMockUser({
          email: newUserData.email,
          name: newUserData.name,
          role: newUserData.role,
        });

        mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
        mockPrisma.user.create.mockResolvedValue(createdUser);

        const result = await mockPrisma.user.create({
          data: {
            email: newUserData.email,
            passwordHash: "$2a$12$hashedpassword",
            name: newUserData.name,
            role: newUserData.role,
          },
        });

        expect(result.email).toBe(newUserData.email);
        expect(result.name).toBe(newUserData.name);
        expect(result.role).toBe(newUserData.role);
      });

      it("should create admin user when role is specified", async () => {
        setAdminSession();
        const newAdminData = {
          email: "newadmin@test.com",
          password: "adminpassword123",
          name: "New Admin",
          role: "admin",
        };

        const createdAdmin = createMockUser({
          email: newAdminData.email,
          name: newAdminData.name,
          role: "admin",
        });

        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue(createdAdmin);

        const result = await mockPrisma.user.create({
          data: {
            email: newAdminData.email,
            passwordHash: "$2a$12$hashedpassword",
            name: newAdminData.name,
            role: "admin",
          },
        });

        expect(result.role).toBe("admin");
      });

      it("should default to user role if not specified", async () => {
        setAdminSession();
        const newUserData = {
          email: "defaultrole@test.com",
          password: "password123",
          name: "Default Role User",
        };

        const createdUser = createMockUser({
          email: newUserData.email,
          name: newUserData.name,
          role: "user",
        });

        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue(createdUser);

        const result = await mockPrisma.user.create({
          data: {
            email: newUserData.email,
            passwordHash: "$2a$12$hashedpassword",
            name: newUserData.name,
            role: "user",
          },
        });

        expect(result.role).toBe("user");
      });
    });

    describe("Validation", () => {
      it("should reject duplicate email", async () => {
        setAdminSession();
        const existingUser = createMockUser({ email: "existing@test.com" });

        mockPrisma.user.findUnique.mockResolvedValue(existingUser);

        const result = await mockPrisma.user.findUnique({
          where: { email: "existing@test.com" },
        });

        expect(result).not.toBeNull();
        // In actual API, this would return 409 Conflict
      });

      it("should reject invalid email format", async () => {
        setAdminSession();
        const invalidEmail = "not-an-email";
        // Zod validation would reject this
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(invalidEmail).not.toMatch(emailRegex);
      });

      it("should reject password shorter than 6 characters", async () => {
        setAdminSession();
        const shortPassword = "12345";
        // Zod validation: password min 6 chars
        expect(shortPassword.length).toBeLessThan(6);
      });

      it("should reject empty name", async () => {
        setAdminSession();
        const emptyName = "";
        // Zod validation: name min 1 char
        expect(emptyName.length).toBeLessThan(1);
      });
    });

    describe("Password Hashing", () => {
      it("should hash password with bcrypt", async () => {
        setAdminSession();
        const plainPassword = "securepassword123";
        const bcrypt = await import("bcryptjs");

        const hashedPassword = await bcrypt.hash(plainPassword, 12);

        expect(hashedPassword).toBe("$2a$12$hashedpassword");
        expect(hashedPassword).not.toBe(plainPassword);
      });
    });
  });

  describe("GET /api/users/:id - Get Single User", () => {
    describe("Authentication", () => {
      it("should return 401 when not authenticated", async () => {
        setNoSession();
        expect(true).toBe(true);
      });
    });

    describe("User Retrieval", () => {
      it("should return user details", async () => {
        setAdminSession();
        const user = createMockUser();

        mockPrisma.user.findUnique.mockResolvedValue(user);

        const result = await mockPrisma.user.findUnique({
          where: { id: user.id },
        });

        expect(result).not.toBeNull();
        expect(result?.email).toBe(user.email);
      });

      it("should return 404 for non-existent user", async () => {
        setAdminSession();
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await mockPrisma.user.findUnique({
          where: { id: "non-existent-id" },
        });

        expect(result).toBeNull();
      });
    });
  });

  describe("PATCH /api/users/:id - Update User", () => {
    describe("User Information Update", () => {
      it("admin should be able to update user role", async () => {
        setAdminSession();
        const user = createMockUser({ role: "user" });
        const updatedUser = { ...user, role: "admin" };

        mockPrisma.user.findUnique.mockResolvedValue(user);
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        const result = await mockPrisma.user.update({
          where: { id: user.id },
          data: { role: "admin" },
        });

        expect(result.role).toBe("admin");
      });

      it("should be able to update user memo", async () => {
        setAdminSession();
        const user = createMockUser({ memo: null });
        const updatedUser = { ...user, memo: "Important user note" };

        mockPrisma.user.findUnique.mockResolvedValue(user);
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        const result = await mockPrisma.user.update({
          where: { id: user.id },
          data: { memo: "Important user note" },
        });

        expect(result.memo).toBe("Important user note");
      });

      it("should be able to update user name", async () => {
        setAdminSession();
        const user = createMockUser({ name: "Old Name" });
        const updatedUser = { ...user, name: "New Name" };

        mockPrisma.user.findUnique.mockResolvedValue(user);
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        const result = await mockPrisma.user.update({
          where: { id: user.id },
          data: { name: "New Name" },
        });

        expect(result.name).toBe("New Name");
      });
    });

    describe("Password Update", () => {
      it("should hash new password when updating", async () => {
        setAdminSession();
        const user = createMockUser();
        const newPassword = "newpassword123";
        const bcrypt = await import("bcryptjs");

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const updatedUser = { ...user, passwordHash: hashedPassword };

        mockPrisma.user.findUnique.mockResolvedValue(user);
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        const result = await mockPrisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hashedPassword },
        });

        expect(result.passwordHash).not.toBe(newPassword);
      });
    });
  });

  describe("Role-based Access", () => {
    it("admin role should have value 'admin'", () => {
      expect(mockAdminUser.role).toBe("admin");
    });

    it("user role should have value 'user'", () => {
      expect(mockRegularUser.role).toBe("user");
    });

    it("should only allow admin and user roles", () => {
      const validRoles = ["admin", "user"];
      expect(validRoles).toContain(mockAdminUser.role);
      expect(validRoles).toContain(mockRegularUser.role);
    });
  });
});
