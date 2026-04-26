"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import type { Quiz } from "@/types";

const emptyQuiz = (): Quiz => ({ question: "", answer: "O" });

export default function NewTrainingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
  });
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    emptyQuiz(),
    emptyQuiz(),
    emptyQuiz(),
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleQuizChange(
    index: number,
    field: keyof Quiz,
    value: string
  ) {
    setQuizzes((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("교육 제목과 내용은 필수입니다.");
      return;
    }
    if (quizzes.some((q) => !q.question.trim())) {
      setError("퀴즈 질문을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: dbError } = await supabase.from("trainings").insert({
      admin_id: user!.id,
      title: form.title.trim(),
      description: form.description.trim(),
      content: form.content.trim(),
      quizzes,
    });

    if (dbError) {
      setError("저장 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    router.push("/trainings");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/trainings" className="text-gray-400 hover:text-gray-600 text-sm">
          ← 교육 목록
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">교육 생성</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 기본 정보 */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">기본 정보</h2>
          <Input
            label="교육 제목 *"
            name="title"
            placeholder="2024년 상반기 안전보건 교육"
            value={form.title}
            onChange={handleFormChange}
            required
            autoFocus
          />
          <Input
            label="교육 설명"
            name="description"
            placeholder="교육 목적이나 대상을 간단히 적어주세요"
            value={form.description}
            onChange={handleFormChange}
          />
        </section>

        {/* 교육 내용 */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">교육 내용</h2>
          <Textarea
            label="교육 내용 *"
            name="content"
            placeholder="직원들이 읽을 교육 내용을 입력하세요.&#10;&#10;예) 작업 전 안전장구를 반드시 착용하세요.&#10;화재 발생 시 비상구를 통해 대피하세요."
            value={form.content}
            onChange={handleFormChange}
            rows={8}
            required
          />
        </section>

        {/* O/X 퀴즈 */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">O/X 퀴즈 (3문항)</h2>
          <p className="text-xs text-gray-400">
            교육 내용을 확인하는 간단한 O/X 문제를 입력해주세요.
          </p>
          {quizzes.map((quiz, i) => (
            <div
              key={i}
              className="flex gap-3 items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0"
            >
              <span className="mt-2 text-sm font-bold text-gray-400 w-4 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 flex flex-col gap-2">
                <Input
                  placeholder={`퀴즈 ${i + 1} 질문`}
                  value={quiz.question}
                  onChange={(e) =>
                    handleQuizChange(i, "question", e.target.value)
                  }
                  required
                />
                <div className="flex gap-2">
                  {(["O", "X"] as const).map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer text-sm font-medium transition-colors ${
                        quiz.answer === opt
                          ? opt === "O"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-red-400 bg-red-50 text-red-700"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`quiz-${i}-answer`}
                        value={opt}
                        checked={quiz.answer === opt}
                        onChange={() => handleQuizChange(i, "answer", opt)}
                        className="sr-only"
                      />
                      {opt === "O" ? "⭕ 맞다" : "❌ 틀리다"}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" loading={loading} className="flex-1">
            교육 저장
          </Button>
          <Link href="/trainings">
            <Button type="button" variant="secondary">
              취소
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
