"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Link from "next/link";
import type { Quiz } from "@/types";
import { TRAINING_TYPE_OPTIONS } from "@/lib/training-types";

const emptyQuiz = (): Quiz => ({ question: "", answer: "O" });

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function buildAutoTitle(workDate: string) {
  if (!workDate) return "";
  return `${workDate} 작업 전 안전교육`;
}

export default function NewTrainingPage() {
  return (
    <Suspense>
      <NewTrainingForm />
    </Suspense>
  );
}

function NewTrainingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialType = searchParams.get("type") ?? "regular_training";

  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    training_type: initialType,
    // 작업 전 안전교육 전용
    work_date: todayStr(),
    work_name: "",
    work_location: "",
    risk_factors: "",
    ppe_check: "",
    daily_notice: "",
    instructor: "",
  });
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    emptyQuiz(),
    emptyQuiz(),
    emptyQuiz(),
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [titleAutoSet, setTitleAutoSet] = useState(false);

  const isPreWork = form.training_type === "pre_work_training";

  // 작업 전 안전교육 선택 시 제목 자동 추천
  useEffect(() => {
    if (isPreWork && !titleAutoSet) {
      setForm((prev) => ({ ...prev, title: buildAutoTitle(prev.work_date) }));
      setTitleAutoSet(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreWork]);

  // 교육 유형이 다른 유형으로 바뀌면 자동 제목 플래그 리셋
  useEffect(() => {
    if (!isPreWork) setTitleAutoSet(false);
  }, [isPreWork]);

  function handleFormChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // 작업일이 바뀌면 제목 자동 갱신 (사용자가 직접 수정 전까지)
      if (name === "work_date" && isPreWork && titleAutoSet) {
        next.title = buildAutoTitle(value);
      }
      return next;
    });
    // 사용자가 직접 제목을 수정하면 자동 추천 비활성화
    if (name === "title") setTitleAutoSet(false);
  }

  function handleQuizChange(index: number, field: keyof Quiz, value: string) {
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
      setError("교육 확인 문항을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const insertData: Record<string, unknown> = {
      admin_id: user!.id,
      title: form.title.trim(),
      description: form.description.trim(),
      content: form.content.trim(),
      quizzes,
      training_type: form.training_type,
    };

    if (isPreWork) {
      insertData.work_date = form.work_date || null;
      insertData.work_name = form.work_name.trim() || null;
      insertData.work_location = form.work_location.trim() || null;
      insertData.risk_factors = form.risk_factors.trim() || null;
      insertData.ppe_check = form.ppe_check.trim() || null;
      insertData.daily_notice = form.daily_notice.trim() || null;
      insertData.instructor = form.instructor.trim() || null;
    }

    const { error: dbError } = await supabase
      .from("trainings")
      .insert(insertData);

    if (dbError) {
      setError("저장 중 오류가 발생했습니다: " + dbError.message);
      setLoading(false);
      return;
    }

    router.push("/trainings");
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/trainings"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 교육 목록
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">안전교육 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 기본 정보 */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">기본 정보</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              교육 유형 <span className="text-red-500">*</span>
            </label>
            <select
              name="training_type"
              value={form.training_type}
              onChange={handleFormChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              {TRAINING_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label={
              isPreWork
                ? "교육 제목 * (작업일 기준 자동 추천, 수정 가능)"
                : "교육 제목 *"
            }
            name="title"
            placeholder={
              isPreWork
                ? "2026-05-02 작업 전 안전교육"
                : "2024년 상반기 안전보건 교육"
            }
            value={form.title}
            onChange={handleFormChange}
            required
            autoFocus={!isPreWork}
          />
          <Input
            label="교육 목적 / 설명"
            name="description"
            placeholder="교육 목적이나 대상을 간단히 적어주세요"
            value={form.description}
            onChange={handleFormChange}
          />
        </section>

        {/* 작업 전 안전교육 전용 필드 */}
        {isPreWork && (
          <section className="rounded-xl bg-green-50 border border-green-200 p-6 shadow-sm flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-green-800">
                작업 전 안전교육 정보
              </h2>
              <p className="text-xs text-green-600 mt-0.5">
                매일 새 교육으로 생성됩니다. 작업일이 바뀌면 새 교육 링크를
                공유해주세요.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  작업일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="work_date"
                  value={form.work_date}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  required
                />
              </div>
              <Input
                label="작업명"
                name="work_name"
                placeholder="예: 선박 블록 조립"
                value={form.work_name}
                onChange={handleFormChange}
              />
            </div>

            <Input
              label="작업 장소"
              name="work_location"
              placeholder="예: 3도크 블록 조립 구역"
              value={form.work_location}
              onChange={handleFormChange}
            />

            <Textarea
              label="주요 위험요인"
              name="risk_factors"
              placeholder="예: 고소 작업 낙하 위험, 용접 화재 위험, 크레인 인양 충돌 위험"
              value={form.risk_factors}
              onChange={handleFormChange}
              rows={3}
            />

            <Textarea
              label="보호구 확인"
              name="ppe_check"
              placeholder="예: 안전모, 안전화, 안전벨트, 용접 마스크 착용 여부 확인"
              value={form.ppe_check}
              onChange={handleFormChange}
              rows={2}
            />

            <Textarea
              label="오늘의 주의사항"
              name="daily_notice"
              placeholder="예: 오늘은 고소 작업이 많으므로 반드시 안전벨트를 착용하고 작업 전 체크리스트를 확인할 것"
              value={form.daily_notice}
              onChange={handleFormChange}
              rows={3}
            />

            <Input
              label="교육 담당자"
              name="instructor"
              placeholder="예: 안전관리자 홍길동"
              value={form.instructor}
              onChange={handleFormChange}
            />
          </section>
        )}

        {/* 교육 내용 */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">교육 내용</h2>
          <Textarea
            label="교육 내용 *"
            name="content"
            placeholder={
              isPreWork
                ? "오늘 작업 전 공유할 안전 내용을 입력하세요.\n\n예) 고소 작업 시 반드시 안전벨트를 착용하세요.\n용접 작업 전 주변 인화성 물질을 제거하세요.\n크레인 작업 반경 5m 이내 출입을 금지합니다."
                : "직원들이 읽을 교육 내용을 입력하세요.\n\n예) 작업 전 안전장구를 반드시 착용하세요.\n화재 발생 시 비상구를 통해 대피하세요."
            }
            value={form.content}
            onChange={handleFormChange}
            rows={8}
            required
          />
        </section>

        {/* 교육 확인 문항 */}
        <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">
              교육 확인 문항 (3문항)
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              교육 내용을 확인하는 O/X 문항을 입력해주세요. 직원은 교육 내용
              확인 후 이 문항에 응답합니다.
            </p>
          </div>
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
                  placeholder={`문항 ${i + 1}`}
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
                      {opt === "O" ? "⭕ 맞다 (O)" : "❌ 틀리다 (X)"}
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
            {isPreWork ? "작업 전 안전교육 저장 및 링크 생성" : "교육 저장"}
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
