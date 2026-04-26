"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SignatureCanvas, {
  type SignatureHandle,
} from "@/components/training/SignatureCanvas";
import type { Employee, Quiz, Training, TrainingAssignment } from "@/types";

type Props = {
  assignment: TrainingAssignment;
  training: Training;
  employee: Employee;
};

type Step = "verify" | "confirmed" | "content" | "quiz" | "sign" | "done";

export default function TrainingForm({ assignment, training, employee }: Props) {
  const supabase = createClient();
  const sigRef = useRef<SignatureHandle>(null);

  const [step, setStep] = useState<Step>("verify");

  // 본인 확인
  const [verifyName, setVerifyName] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // 퀴즈
  const [answers, setAnswers] = useState<("O" | "X" | null)[]>(
    training.quizzes.map(() => null)
  );
  const [quizError, setQuizError] = useState("");

  // 서명 제출
  const [signError, setSignError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const quizzes: Quiz[] = training.quizzes;

  // ── 본인 확인 ─────────────────────────────────────
  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifyError("");
    setVerifying(true);

    const nameMatch = verifyName.trim() === employee.name.trim();
    const phoneLast4 = employee.phone.replace(/\D/g, "").slice(-4);
    const inputLast4 = verifyPhone.replace(/\D/g, "").slice(-4);
    const phoneMatch = phoneLast4 === inputLast4;

    if (!nameMatch || !phoneMatch) {
      setVerifyError(
        "등록된 직원 정보를 찾을 수 없습니다. 이름과 전화번호 뒷자리를 다시 확인해주세요."
      );
      setVerifying(false);
      return;
    }

    setVerifying(false);
    setStep("confirmed");
  }

  // ── 퀴즈 ─────────────────────────────────────────
  function handleAnswer(index: number, value: "O" | "X") {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
    setQuizError("");
  }

  function handleQuizSubmit() {
    if (answers.some((a) => a === null)) {
      setQuizError("모든 문제에 답을 선택해주세요.");
      return;
    }
    setStep("sign");
  }

  // ── 최종 제출 ─────────────────────────────────────
  async function handleFinalSubmit() {
    if (sigRef.current?.isEmpty()) {
      setSignError("서명을 해주세요.");
      return;
    }
    setSubmitting(true);
    setSignError("");

    const signatureData = sigRef.current!.toDataURL();

    const { error } = await supabase
      .from("training_assignments")
      .update({
        status: "completed",
        quiz_answers: answers,
        signature_data: signatureData,
        completed_at: new Date().toISOString(),
      })
      .eq("id", assignment.id);

    if (error) {
      setSignError("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitting(false);
      return;
    }

    setStep("done");
  }

  // ── 완료 화면 ─────────────────────────────────────
  if (step === "done") {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">교육 완료!</h2>
        <p className="text-gray-600">
          <strong>{employee.name}</strong>님의 안전교육 이수 기록이
          정상적으로 저장되었습니다.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          이 화면을 캡처해두시거나 창을 닫으셔도 됩니다.
        </p>
      </div>
    );
  }

  // ── 단계 진행바 ───────────────────────────────────
  const steps = [
    { key: "verify",    label: "본인 확인" },
    { key: "content",   label: "교육 내용" },
    { key: "quiz",      label: "퀴즈" },
    { key: "sign",      label: "서명" },
  ];
  const currentStepIndex = steps.findIndex((s) =>
    step === "confirmed" ? s.key === "verify" : s.key === step
  );

  return (
    <div className="flex flex-col gap-5">
      {/* 진행 단계 */}
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === currentStepIndex
                  ? "bg-blue-600 text-white"
                  : i < currentStepIndex
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < currentStepIndex ? "✓ " : `${i + 1}. `}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-3 ${i < currentStepIndex ? "bg-blue-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP: 본인 확인 ── */}
      {step === "verify" && (
        <form
          onSubmit={handleVerify}
          className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-5"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900">직원 본인 확인</h2>
            <p className="text-sm text-gray-500 mt-1">
              교육 이수 기록을 정확히 남기기 위해 이름과 전화번호 뒷자리를 입력해주세요.
            </p>
          </div>

          <Input
            label="이름"
            placeholder="홍길동"
            value={verifyName}
            onChange={(e) => setVerifyName(e.target.value)}
            required
            autoFocus
            autoComplete="name"
          />
          <Input
            label="전화번호 뒷자리 4자리"
            placeholder="1234"
            value={verifyPhone}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              setVerifyPhone(v);
            }}
            inputMode="numeric"
            maxLength={4}
            required
          />

          {verifyError && (
            <p className="text-sm text-red-500 rounded-lg bg-red-50 border border-red-100 p-3">
              {verifyError}
            </p>
          )}

          <Button type="submit" loading={verifying} className="w-full py-3 text-base">
            교육 시작하기
          </Button>
        </form>
      )}

      {/* ── STEP: 본인 확인 완료 → 교육 시작 확인 ── */}
      {step === "confirmed" && (
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-5">
          <div className="rounded-lg bg-green-50 border border-green-100 p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">본인 확인 완료</p>
              <p className="text-sm text-green-700 mt-0.5">
                아래 정보로 교육을 시작합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <InfoRow label="이름" value={employee.name} />
            <InfoRow label="부서 / 직급" value={employee.department || "-"} />
            <InfoRow label="교육명" value={training.title} />
          </div>

          <Button onClick={() => setStep("content")} className="w-full py-3 text-base">
            교육 내용 확인하기 →
          </Button>
        </div>
      )}

      {/* ── STEP: 교육 내용 ── */}
      {step === "content" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-100">
              <span className="font-semibold text-gray-900">{employee.name}</span>
              {employee.department && (
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  {employee.department}
                </span>
              )}
            </div>

            {training.description && (
              <p className="text-sm text-gray-500">{training.description}</p>
            )}

            <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[120px]">
              {training.content}
            </div>
          </div>

          <Button onClick={() => setStep("quiz")} className="w-full py-3 text-base">
            내용을 확인했습니다 → 퀴즈 풀기
          </Button>
        </div>
      )}

      {/* ── STEP: O/X 퀴즈 ── */}
      {step === "quiz" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
            <h2 className="font-bold text-gray-900">O/X 퀴즈</h2>
            {quizzes.map((quiz, i) => (
              <div key={i} className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  <span className="text-blue-600 font-bold mr-1.5">Q{i + 1}.</span>
                  {quiz.question}
                </p>
                <div className="flex gap-3">
                  {(["O", "X"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleAnswer(i, opt)}
                      className={`flex-1 rounded-xl py-5 text-3xl border-2 transition-all active:scale-95 ${
                        answers[i] === opt
                          ? opt === "O"
                            ? "border-blue-500 bg-blue-50"
                            : "border-red-400 bg-red-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {opt === "O" ? "⭕" : "❌"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {quizError && (
            <p className="text-sm text-red-500 text-center bg-red-50 border border-red-100 rounded-lg p-3">
              {quizError}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep("content")} className="flex-1">
              ← 이전
            </Button>
            <Button onClick={handleQuizSubmit} className="flex-1 py-3">
              다음 → 서명
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP: 전자서명 ── */}
      {step === "sign" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <h2 className="font-bold text-gray-900">전자서명</h2>

            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900 leading-relaxed">
              본인(<strong>{employee.name}</strong>)은{" "}
              <strong>{new Date().toLocaleDateString("ko-KR")}</strong>에
              주식회사 원엔지니어링의 안전교육을 성실히 이수하였음을 확인하고 서명합니다.
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                아래 박스에 손가락 또는 마우스로 서명하세요
              </p>
              <SignatureCanvas ref={sigRef} />
            </div>
          </div>

          {signError && (
            <p className="text-sm text-red-500 text-center bg-red-50 border border-red-100 rounded-lg p-3">
              {signError}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep("quiz")} className="flex-1">
              ← 이전
            </Button>
            <Button onClick={handleFinalSubmit} loading={submitting} className="flex-1 py-3">
              교육 완료 제출
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
