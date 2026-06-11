export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import PrintStyles from "@/components/print/PrintStyles";
import PrintDocumentHeader from "@/components/print/PrintDocumentHeader";
import PrintDocumentFooter from "@/components/print/PrintDocumentFooter";
import PrintButtonBar from "@/components/print/PrintButtonBar";
import { thStyle, tdStyle, sectionTitleStyle } from "@/components/print/printStyleConstants";
import type { Employee, Training, TrainingAssignment } from "@/types";
import { getTypeLabel } from "@/lib/training-types";

type AssignmentWithEmployee = TrainingAssignment & { employees: Employee };

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds < 0) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PrintTrainingPage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: training } = await supabase
    .from("trainings")
    .select("*")
    .eq("id", trainingId)
    .eq("admin_id", user.id)
    .single();

  if (!training) notFound();

  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("admin_id", user.id)
    .order("name");

  const { data: assignments } = await supabase
    .from("training_assignments")
    .select("*, employees(*)")
    .eq("training_id", trainingId);

  const allEmployees: Employee[] = employees ?? [];
  const allAssignments = (assignments ?? []) as AssignmentWithEmployee[];
  const assignmentMap = new Map(allAssignments.map((a) => [a.employee_id, a]));

  const completedCount = allAssignments.filter((a) => a.status === "completed").length;
  const pendingCount = allEmployees.length - completedCount;

  const t = training as Training;
  const quizzes = t.quizzes ?? [];
  const printDate = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <PrintStyles />
      <PrintButtonBar
        backHref={`/trainings/${trainingId}`}
        backLabel="← 돌아가기"
        pageTitle="교육 이수 기록 출력"
        hasAppendix={allEmployees.length > 0}
      />

      {/* ── 본문 섹션 (A4 세로) ── */}
      <div className="print-body-section mx-auto bg-white px-10 py-8 print:px-0 print:py-0" style={{ maxWidth: "210mm" }}>
        <PrintDocumentHeader
          title="안전교육 이수 기록"
          subtitle="Safety Training Completion Record"
        />

        {/* 교육 기본 정보 */}
        <section style={{ marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>교육 기본 정보</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <tbody>
              <tr>
                <th style={thStyle}>교육명</th>
                <td style={{ ...tdStyle, fontWeight: "bold", fontSize: "14px" }} colSpan={3}>
                  {t.title}
                </td>
              </tr>
              <tr>
                <th style={thStyle}>교육 유형</th>
                <td style={tdStyle}>{getTypeLabel(t.training_type ?? "regular_training")}</td>
                <th style={thStyle}>출력일자</th>
                <td style={tdStyle}>{printDate}</td>
              </tr>
              <tr>
                <th style={thStyle}>교육 목적</th>
                <td style={tdStyle} colSpan={3}>{t.description || "-"}</td>
              </tr>
              <tr>
                <th style={thStyle}>전체 대상자</th>
                <td style={tdStyle}>{allEmployees.length}명</td>
                <th style={thStyle}>이수 완료 / 미이수</th>
                <td style={tdStyle}>
                  이수 완료 {completedCount}명 / 미이수 {pendingCount}명
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 작업 전 안전교육 전용 정보 */}
        {t.training_type === "pre_work_training" && (
          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ ...sectionTitleStyle, borderLeftColor: "#16a34a" }}>작업 전 안전교육 정보</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <tbody>
                <tr>
                  <th style={thStyle}>작업일</th>
                  <td style={tdStyle}>{t.work_date || "-"}</td>
                  <th style={thStyle}>작업명</th>
                  <td style={tdStyle}>{t.work_name || "-"}</td>
                </tr>
                <tr>
                  <th style={thStyle}>작업 장소</th>
                  <td style={tdStyle} colSpan={3}>{t.work_location || "-"}</td>
                </tr>
                <tr>
                  <th style={thStyle}>교육 담당자</th>
                  <td style={tdStyle} colSpan={3}>{t.instructor || "-"}</td>
                </tr>
                <tr>
                  <th style={{ ...thStyle, whiteSpace: "normal" }}>주요 위험요인</th>
                  <td style={{ ...tdStyle, whiteSpace: "pre-wrap" }} colSpan={3}>{t.risk_factors || "-"}</td>
                </tr>
                <tr>
                  <th style={{ ...thStyle, whiteSpace: "normal" }}>보호구 확인</th>
                  <td style={{ ...tdStyle, whiteSpace: "pre-wrap" }} colSpan={3}>{t.ppe_check || "-"}</td>
                </tr>
                <tr>
                  <th style={{ ...thStyle, whiteSpace: "normal" }}>오늘의 주의사항</th>
                  <td style={{ ...tdStyle, whiteSpace: "pre-wrap" }} colSpan={3}>{t.daily_notice || "-"}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* 교육 내용 */}
        <section style={{ marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>교육 내용</h2>
          <div style={{
            border: "1px solid #ccc", borderRadius: "4px",
            padding: "12px 16px", fontSize: "12px",
            lineHeight: "1.8", whiteSpace: "pre-wrap", background: "#fafafa",
          }}>
            {t.content}
          </div>
        </section>

        {/* 교육 확인 문항 */}
        {quizzes.length > 0 && (
          <section style={{ marginBottom: "20px" }}>
            <h2 style={sectionTitleStyle}>교육 확인 문항</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ ...thStyle, width: "52px" }}>번호</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>문항</th>
                  <th style={{ ...thStyle, width: "56px", textAlign: "center" }}>정답</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, textAlign: "center" }}>문항 {i + 1}</td>
                    <td style={tdStyle}>{q.question}</td>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: "bold", fontSize: "14px" }}>{q.answer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 교육 담당자 확인 */}
        <section style={{ marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>교육 담당자 확인</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <tbody>
              <tr>
                <th style={thStyle}>교육 담당자</th>
                <td style={tdStyle}>{t.confirmed_by || (t.instructor ?? "-")}</td>
                <th style={thStyle}>확인일시</th>
                <td style={tdStyle}>{t.confirmed_at ? new Date(t.confirmed_at).toLocaleString("ko-KR") : "-"}</td>
              </tr>
              <tr>
                <th style={thStyle}>확인 메모</th>
                <td style={{ ...tdStyle, whiteSpace: "pre-wrap" }} colSpan={3}>{t.confirmation_memo || "-"}</td>
              </tr>
              <tr>
                <th style={thStyle}>관리자 확인란</th>
                <td style={{ ...tdStyle, height: "50px" }} colSpan={3}>
                  {t.confirmed_at ? (
                    <span style={{ color: "#166534", fontWeight: "bold" }}>✓ 확인 완료</span>
                  ) : (
                    <span style={{ color: "#aaa" }}>미확인 (서명란)</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <div style={{
          border: "1px solid #ddd", borderRadius: "4px",
          padding: "10px 14px", marginBottom: "16px",
          background: "#f9fafb", fontSize: "11px",
          color: "#555", lineHeight: "1.6",
        }}>
          본 문서는 안전교육 이행 기록 및 서명 증빙 관리를 위해 생성되었습니다.
          직원별 교육 참여 및 전자서명 기록을 보관합니다.
        </div>

        <PrintDocumentFooter />
      </div>

      {/* ── 서명 부록 (A4 가로, 이수 현황) ── */}
      {allEmployees.length > 0 && (
        <div className="print-appendix-section mx-auto bg-white px-10 py-8 print:px-0 print:py-0 mt-8" style={{ maxWidth: "270mm" }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "12px", marginBottom: "16px" }}>
            <p style={{ fontSize: "11px", color: "#555", letterSpacing: "1px", marginBottom: "4px" }}>
              주식회사 원엔지니어링 — {t.title}
            </p>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "4px 0" }}>별첨 1 · 직원별 이수 현황 서명부</h2>
            <p style={{ fontSize: "11px", color: "#777", margin: 0 }}>Employee Completion &amp; Signature Appendix</p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ ...thStyle, width: "28px", textAlign: "center" }}>No</th>
                <th style={{ ...thStyle, width: "70px" }}>이름</th>
                <th style={{ ...thStyle, width: "90px" }}>부서 / 직급</th>
                <th style={{ ...thStyle, width: "52px", textAlign: "center" }}>이수 상태</th>
                <th style={{ ...thStyle, width: "100px", textAlign: "center" }}>교육 시작</th>
                <th style={{ ...thStyle, width: "100px", textAlign: "center" }}>제출 완료</th>
                <th style={{ ...thStyle, width: "52px", textAlign: "center" }}>소요 시간</th>
                <th style={{ ...thStyle, width: "56px", textAlign: "center" }}>확인 결과</th>
                <th style={{ ...thStyle }}>전자서명</th>
              </tr>
            </thead>
            <tbody>
              {allEmployees.map((emp, idx) => {
                const a = assignmentMap.get(emp.id);
                const isCompleted = a?.status === "completed";
                const quizCorrect =
                  isCompleted && a?.quiz_answers
                    ? a.quiz_answers.filter((ans, i) => ans === quizzes[i]?.answer).length
                    : null;

                return (
                  <tr key={emp.id}>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: "500" }}>{emp.name}</td>
                    <td style={tdStyle}>{emp.department || "-"}</td>
                    <td style={{
                      ...tdStyle, textAlign: "center", fontWeight: "bold",
                      color: isCompleted ? "#166534" : "#92400e", fontSize: "10px",
                    }}>
                      {isCompleted ? "이수 완료" : "미이수"}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "10px", textAlign: "center" }}>
                      {formatDateTime(a?.started_at ?? null)}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "10px", textAlign: "center" }}>
                      {formatDateTime(a?.completed_at ?? null)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {formatDuration(a?.duration_seconds ?? null)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {quizCorrect !== null ? `${quizCorrect}/${quizzes.length}` : "-"}
                    </td>
                    <td style={{ ...tdStyle, height: "56px", textAlign: "center", padding: "4px" }}>
                      {a?.signature_data ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.signature_data}
                          alt={`${emp.name} 서명`}
                          style={{ maxHeight: "48px", maxWidth: "120px", margin: "0 auto", display: "block" }}
                        />
                      ) : (
                        <span style={{ color: "#d1d5db" }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "10px", color: "#9ca3af", borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
            <span>주식회사 원엔지니어링</span>
            <span>
              이수 완료 {completedCount}명 / 전체 {allEmployees.length}명 · 출력일시: {new Date().toLocaleString("ko-KR")}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
