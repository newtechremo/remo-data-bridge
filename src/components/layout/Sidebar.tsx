"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isAdmin: boolean;
}

export default function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "대시보드", icon: "📊" },
    { href: "/requests", label: "분석 요청", icon: "📋" },
    { href: "/requests/new", label: "새 요청", icon: "➕" },
  ];

  const adminItems = [
    { href: "/admin", label: "관리자", icon: "⚙️" },
    { href: "/admin/users", label: "사용자 관리", icon: "👥" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">분석 요청 시스템</h1>
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
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase">
                관리자 메뉴
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
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
