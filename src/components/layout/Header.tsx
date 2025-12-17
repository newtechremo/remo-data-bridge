"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import LanguageSelector from "@/components/ui/LanguageSelector";

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const t = useTranslations();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("dashboard.welcome")}, {user.name || user.email}
          </h2>
          <p className="text-sm text-gray-500">
            {user.role === "admin" ? t("users.roleAdmin") : t("users.roleUser")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            {t("auth.logout")}
          </Button>
        </div>
      </div>
    </header>
  );
}
