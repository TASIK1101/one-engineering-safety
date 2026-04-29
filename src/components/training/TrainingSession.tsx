"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SignatureCanvas, { type SignatureHandle } from "./SignatureCanvas";
import type { Quiz, Training } from "@/types";

type Step =
  | "verify"
  | "confirmed"
  | "content"
  | "quiz"
  | "sign"
  | "done"
  | "already_done";

type VerifiedEmployee = { id: string; name: string; department: string };
type AssignmentRef = { id: string; status: string; started_at: string | null };

export default function TrainingSession({ training }: { training: Training }) {
  const sigRef = useRef<SignatureHandle>(null);

  const [step, setStep] = useState<Step>("verify");
  const [employee, setEmployee] = useState<VerifiedEmployee | null>(null);
  const [assignment, setAssignment] = useState<AssignmentRef | null>(null);

  // 본인 확인
  const [verifyName, setVerifyName] = useState("");
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // 교육 확인 문항
  const [answers, setAnswers] = useState<("O" | "X" | null)[]>(
    training.quizzes.map(() => null)
  );
  const [quizError, setQuizError] = useState("");

  // 서명/제출
  const [consentChecked, setConsentChecked] = useState(false);
  const [signError, setSignError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const quizzes: Quiz[] = training.quizzes;

  // ── 본인 확인 ────────────────────────────────────────────
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setVerifyError("");

    const inputLast4 = verifyPhone.replace(/\D/g, "").slice(-4);
    if (inputLast4.length !== 4) {
      setVerifyError("전화번호 뒷자리 4자리를 정확히 입력해주세요.");
      setVerifying(false);
      return;
    }

    try {
      const res = await fetch("/api/verify-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainingId: training.id,
          name: verifyName.trim(),
          phoneLast4: inputLast4,
        }),
      });

      const data = await res.json();

      if (res.status === 404 || data.error === "not_found") {
        setVerifyError(
          "등록된 직원 정보를 찾을 수 없습니다. 이름과 전화번호 뒷자리를 다시 확인해주세요."
        );
        setVerifying(false);
        return;
      }

      if (!res.ok) {
        setVerifyError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        setVerifying(false);
        return;
      }

      if (data.assignment.status === "completed") {
        setEmployee(data.employee);
        setStep("already_done");
        setVerifying(false);
        return;
      }

      setEmployee(data.employee);
      setAssignment(data.assignment);
      setVerifying(false);
      setStep("confirmed");
    } catch (err) {
      console.error("verify error:", err);
      setVerifyError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setVerifying(false);
    }
  }

  // ── 교육 확인 문항 ────────────────────────────────────────
  function handleAnswer(index: number, value: "O" | "X") {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
    setQuizError("");
  }

  function handleQuizNext() {
    if (answers.some((a) => a === null)) {
      setQuizError("모든 문항에 응답해주세요.");
      return;
    }
    setStep("sign");
  }

  // ── 최종 제출 ─────────────────────────────────────────────
  async function handleSubmit() {
    if (!consentChecked) {
      setSignError("동의 체크박스를 선택해주세요.");
      return;
    }
    if (sigRef.current?.isEmpty()) {
      setSignError("서명을 해주세요.");
      return;
    }
    setSubmitting(true);
    setSignError("");

    try {
      const res = await fetch("/api/submit-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignment!.id,
          quizAnswers: answers,
          signatureData: sigRef.current!.toDataURL(),
          consentChecked: true,
        }),
      });

      const data = await res.json();

      if (data.error === "already_completed") {
        setStep("already_done");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        setSignError("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
        setSubmitting(false);
        return;
      }

      setStep("done");
    } catch (err) {
      console.error("submit error:", err);
      setSignError("서버 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  // ── 진행 단계 표시 ────────────────────────────────────────
  const stepOrder: Step[] = ["verify", "content", "quiz", "sign"];
  const currentIndex = stepOrder.indexOf(
    step === "confirmed" ? "verify" : step
  );
  const stepLabels = ["본인 확인", "교육 내용", "문항 응답", "서명"];

  // ══════════════════════════════════════════════════════════

  if (step === "already_done") {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          이미 이수 완료된 교육입니다
        </h2>
        <p className="text-gray-500 text-sm">
          {employee && <><strong>{employee.name}</strong>님은 </>}
          이 교육을 이미 이수 완료하셨습니다.
        </p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          교육 이수 완료!
        </h2>
        <p className="text-gray-600">
          <strong>{employee?.name}</strong>님의 안전교육 이수 기록 및
          전자서명이 정상적으로 저장되었습니다.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          이 화면을 캡처하거나 창을 닫으셔도 됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 진행 단계 바 */}
      <div className="flex items-center gap-1">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div
              className={`flex-1 text-center rounded-full px-2 py-1 text-xs font-medium transition-colors ${
                i === currentIndex
                  ? "bg-blue-600 text-white"
                  : i < currentIndex
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < currentIndex ? `✓ ${label}` : `${i + 1}. ${label}`}
            </div>
            {i < stepLabels.length - 1 && (
              <div
                className={`w-2 h-px shrink-0 ${
                  i < currentIndex ? "bg-blue-300" : "bg-gray-200"
                }`}
              />
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
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              교육 이수 기록을 정확히 남기기 위해<br />
              이름과 전화번호 뒷자리를 입력해주세요.
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
            onChange={(e) =>
              setVerifyPhone(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            maxLength={4}
            required
          />

          {verifyError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 leading-relaxed">
              {verifyError}
            </p>
          )}

          <Button
            type="submit"
            loading={verifying}
            className="w-full py-3 text-base"
          >
            교육 참여 확인
          </Button>
        </form>
      )}

      {/* ── STEP: 본인 확인 완료 ── */}
      {step === "confirmed" && employee && (
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg p-4">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">본인 확인 완료</p>
              <p className="text-sm text-green-700 mt-0.5">
                아래 정보로 교육을 시작합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <InfoRow label="이름" value={employee.name} />
            <InfoRow label="부서 / 직급" value={employee.department || "-"} />
            <InfoRow label="교육명" value={training.title} />
          </div>

          <Button
            onClick={() => setStep("content")}
            className="w-full py-3 text-base"
          >
            교육 내용 확인하기 →
          </Button>
        </div>
      )}

      {/* ── STEP: 교육 내용 ── */}
      {step === "content" && employee && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-100">
              <span className="font-semibold text-gray-900">{employee.name}</span>
              {employee.department && (
                <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">
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

          <Button
            onClick={() => setStep("quiz")}
            className="w-full py-3 text-base"
          >
            내용을 확인했습니다 → 교육 확인 문항 응답
          </Button>
        </div>
      )}

      {/* ── STEP: 교육 확인 문항 ── */}
      {step === "quiz" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="font-bold text-gray-900">교육 확인 문항</h2>
              <p className="text-xs text-gray-500 mt-1">
                아래 문항은 교육 내용을 확인하기 위한 절차입니다.
                모든 문항에 응답한 뒤 전자서명을 진행해주세요.
              </p>
            </div>
            {quizzes.map((quiz, i) => (
              <div key={i} className="flex flex-col gap-3">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  <span className="text-blue-600 font-bold mr-1.5">
                    문항 {i + 1}.
                  </span>
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
            <p className="text-sm text-red-600 text-center bg-red-50 border border-red-100 rounded-lg p-3">
              {quizError}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setStep("content")}
              className="flex-1"
            >
              ← 이전
            </Button>
            <Button onClick={handleQuizNext} className="flex-1 py-3">
              다음 → 전자서명
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP: 전자서명 ── */}
      {step === "sign" && employee && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <h2 className="font-bold text-gray-900">전자서명</h2>

            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900 leading-relaxed">
              본인(<strong>{employee.name}</strong>)은{" "}
              <strong>{new Date().toLocaleDateString("ko-KR")}</strong>에
              주식회사 원엔지니어링의 안전교육을 성실히 이수하였음을 확인하고
              서명합니다.
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                아래 박스에 손가락 또는 마우스로 서명하세요
              </p>
              <SignatureCanvas ref={sigRef} />
            </div>

            {/* 동의 체크박스 */}
            <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-4">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => {
                  setConsentChecked(e.target.checked);
                  if (e.target.checked) setSignError("");
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-400 text-blue-600 shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                본인은 위 안전교육 내용을 직접 확인했으며, 교육 이수 기록 및
                전자서명 저장에 동의합니다.
              </span>
            </label>
          </div>

          {signError && (
            <p className="text-sm text-red-600 text-center bg-red-50 border border-red-100 rounded-lg p-3">
              {signError}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setStep("quiz")}
              className="flex-1"
            >
              ← 이전
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={!consentChecked}
              className={`flex-1 py-3 ${!consentChecked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              서명 후 제출
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
