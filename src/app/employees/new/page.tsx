"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";

export default function NewEmployeePage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ name: "", phone: "", department: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("이름과 전화번호는 필수입니다.");
      return;
    }
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: dbError } = await supabase.from("employees").insert({
      admin_id: user!.id,
      name: form.name.trim(),
      phone: form.phone.trim(),
      department: form.department.trim(),
    });

    if (dbError) {
      setError("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    router.push("/employees");
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employees" className="text-gray-400 hover:text-gray-600 text-sm">
          ← 직원 목록
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">직원 등록</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4"
      >
        <Input
          label="이름 *"
          name="name"
          placeholder="홍길동"
          value={form.name}
          onChange={handleChange}
          required
          autoFocus
        />
        <Input
          label="전화번호 *"
          name="phone"
          placeholder="010-1234-5678"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <Input
          label="부서 / 역할"
          name="department"
          placeholder="생산팀, 현장직, 주방 등"
          value={form.department}
          onChange={handleChange}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2 mt-2">
          <Button type="submit" loading={loading} className="flex-1">
            등록하기
          </Button>
          <Link href="/employees">
            <Button type="button" variant="secondary">
              취소
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
