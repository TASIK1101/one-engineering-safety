"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import CompanyLogo from "@/components/ui/CompanyLogo";

const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/employees", label: "교육 대상자 관리" },
  { href: "/trainings", label: "안전교육 관리" },
  { href: "/records", label: "교육기록 보관함" },
  { href: "/reports", label: "이수기록 출력" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard">
            <CompanyLogo size="sm" />
          </Link>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-sm text-slate-500"
        >
          로그아웃
        </Button>
      </div>
    </header>
  );
}
