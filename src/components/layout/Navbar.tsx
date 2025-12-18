"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/ui/LanguageSelector";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
  isAdmin: boolean;
}

export default function Navbar({ user, isAdmin }: NavbarProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const mainNavItems = [
    { href: "/dashboard", labelKey: "nav.dashboard" },
    { href: "/requests", labelKey: "nav.requests" },
    { href: "/requests/new", labelKey: "nav.newRequest" },
  ];

  const adminNavItems = [
    { href: "/admin", labelKey: "nav.admin" },
    { href: "/admin/users", labelKey: "nav.users" },
  ];

  const isActive = (href: string) => {
    // Exact match for specific routes
    if (href === "/dashboard" || href === "/requests/new") {
      return pathname === href;
    }
    // For /requests, match exact or /requests/[id] but not /requests/new
    if (href === "/requests") {
      return pathname === href || (pathname.startsWith("/requests/") && !pathname.startsWith("/requests/new"));
    }
    // For /admin, match exact but not /admin/users
    if (href === "/admin") {
      return pathname === href;
    }
    // For /admin/users, match exact or starts with
    if (href === "/admin/users") {
      return pathname.startsWith(href);
    }
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center group-hover:bg-accent transition-colors duration-300">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-[900] tracking-tighter text-primary">REMO</div>
              <div className="text-[9px] uppercase text-accent tracking-[0.2em] font-bold -mt-1">Data Bridge</div>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-md transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-primary text-white shadow-md"
                      : "text-slate-500 hover:text-primary"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
              {isAdmin && adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-md transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-primary text-white shadow-md"
                      : "text-slate-500 hover:text-primary"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <LanguageSelector />
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            
            {/* User Info */}
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">
                {user.email}
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                  {user.role === "admin" ? t("users.roleAdmin") : t("users.roleUser")}
                </span>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200"
              title={t("auth.logout")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden pb-3 -mt-1">
          <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 rounded-lg p-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            {isAdmin && adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-500 hover:text-primary"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
