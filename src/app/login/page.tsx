"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CompanyLogo from "@/components/ui/CompanyLogo";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">

        {/* 로고 영역 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <CompanyLogo size="lg" />
          <p className="text-sm text-slate-500 text-center leading-relaxed">
            관리자 계정으로 로그인하여<br />
            직원 교육 현황과 서명 기록을 관리하세요.
          </p>
        </div>

        {/* 로그인 폼 */}
        <form
          onSubmit={handleLogin}
          className="rounded-xl bg-white px-8 py-7 shadow-sm border border-slate-200 flex flex-col gap-4"
        >
          <Input
            label="이메일"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-1">
            로그인
          </Button>
        </form>

        {/* 하단 안내 */}
        <p className="mt-5 text-center text-xs text-slate-400">
          본 시스템은 안전교육 이행 기록 및 서명 증빙 관리를 위한 내부 도구입니다.
        </p>
      </div>
    </div>
  );
}
