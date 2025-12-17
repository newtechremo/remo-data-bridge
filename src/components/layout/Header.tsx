"use client";

import { signOut } from "next-auth/react";
import Button from "@/components/ui/Button";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            안녕하세요, {user.name || user.email}님
          </h2>
          <p className="text-sm text-gray-500">
            {user.role === "admin" ? "관리자" : "일반 사용자"}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          로그아웃
        </Button>
      </div>
    </header>
  );
}
