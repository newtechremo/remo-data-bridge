"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isAdmin: boolean;
}

export default function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const navItems = [
    { href: "/dashboard", labelKey: "nav.dashboard", icon: "📊" },
    { href: "/requests", labelKey: "nav.requests", icon: "📋" },
    { href: "/requests/new", labelKey: "nav.newRequest", icon: "➕" },
  ];

  const adminItems = [
    { href: "/admin", labelKey: "nav.admin", icon: "⚙️" },
    { href: "/admin/users", labelKey: "nav.users", icon: "👥" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">{t("common.appName")}</h1>
      </div>
      <nav className="px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-4 py-3 text-sm font-medium rounded-lg",
              "transition-colors duration-200",
              pathname === item.href
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <span className="mr-3">{item.icon}</span>
            {t(item.labelKey)}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase">
                {t("nav.admin")}
              </p>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg",
                  "transition-colors duration-200",
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {t(item.labelKey)}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
