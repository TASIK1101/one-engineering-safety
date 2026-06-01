"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CompanyLogo from "@/components/ui/CompanyLogo";

const navItems = [
  { href: "/dashboard",          label: "대시보드" },
  { href: "/employees",          label: "교육 대상자" },
  { href: "/trainings",          label: "안전교육" },
  { href: "/tbm",                label: "TBM 교육" },
  { href: "/work-permits",       label: "작업허가서" },
  { href: "/inspections",        label: "안전점검" },
  { href: "/corrective-actions", label: "시정조치" },
  { href: "/records",            label: "통합 기록" },
  { href: "/reports",            label: "이수기록 출력" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      {/* ── 데스크탑 / 태블릿 ── */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
        {/* 로고 */}
        <Link href="/dashboard" className="shrink-0">
          <CompanyLogo size="sm" />
        </Link>

        {/* 데스크탑 네비 (lg 이상) */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 mx-4 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 우측: 로그아웃 (데스크탑) + 햄버거 (모바일/태블릿) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden lg:block text-sm text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            로그아웃
          </button>
          {/* 햄버거 버튼 (lg 미만) */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="메뉴 열기"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── 모바일/태블릿 드롭다운 메뉴 ── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 mt-2">
            <button
              onClick={handleLogout}
              className="w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
