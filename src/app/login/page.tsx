"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Image from "next/image";

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

        {/* 회사 브랜드 영역 */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Image
            src="/logo.png"
            alt="주식회사 원엔지니어링"
            width={72}
            height={72}
            priority
            className="object-contain rounded-full"
          />
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase mb-1">
              One Engineering
            </p>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">
              주식회사 원엔지니어링
            </h1>
            <p className="text-sm font-medium text-blue-700 mt-1">
              현장 교육기록 · 전자서명 관리 시스템
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            안전교육 이행 기록과 전자서명 증빙을<br />체계적으로 관리합니다.
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-800 px-6 py-4">
            <p className="text-sm font-semibold text-white">관리자 로그인</p>
            <p className="text-xs text-slate-400 mt-0.5">
              관리자 계정으로 로그인해주세요.
            </p>
          </div>
          <form onSubmit={handleLogin} className="px-6 py-6 flex flex-col gap-4">
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
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full py-2.5 mt-1">
              로그인
            </Button>
          </form>
        </div>

        {/* 하단 안내 */}
        <p className="mt-5 text-center text-xs text-slate-400 leading-relaxed">
          관리자 전용 페이지입니다.<br />
          본 시스템은 안전교육 이행 기록 및 서명 증빙 관리를 위한 내부 도구입니다.
        </p>
      </div>
    </div>
  );
}
