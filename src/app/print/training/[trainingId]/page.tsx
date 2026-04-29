export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import PrintButton from "./PrintButton";
import type { Employee, Training, TrainingAssignment } from "@/types";

type AssignmentWithEmployee = TrainingAssignment & { employees: Employee };

export default async function PrintTrainingPage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const completedCount = allAssignments.filter(
    (a) => a.status === "completed"
  ).length;
  const pendingCount = allEmployees.length - completedCount;

  const t = training as Training;
  const quizzes = t.quizzes ?? [];

  const printDate = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const printDateTime = new Date().toLocaleString("ko-KR");

  return (
    <>
      {/* 인쇄 시 숨겨지는 스타일 + @page A4 설정 */}
      <style>{`
        @page {
          size: A4;
          margin: 15mm;
        }
        @media print {
          .no-print { display: none !important; }
          body {
            font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Nanum Gothic', Arial, sans-serif;
            color: #000 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          .section-break { page-break-before: auto; }
        }
        body {
          font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Nanum Gothic', Arial, sans-serif;
        }
      `}</style>

      {/* 상단 조작 바 (인쇄 시 숨김) */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href={`/trainings/${trainingId}`}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            ← 돌아가기
          </a>
          <span className="text-sm font-semibold text-gray-800">
            교육일지 미리보기 — 인쇄하거나 PDF로 저장하세요
          </span>
        </div>
        <PrintButton />
      </div>

      {/* 인쇄 문서 본문 */}
      <div
        className="mx-auto bg-white px-10 py-8 print:px-0 print:py-0"
        style={{ maxWidth: "210mm" }}
      >
        {/* ── 문서 헤더 ── */}
        <div
          className="text-center pb-4 mb-6"
          style={{ borderBottom: "2px solid #111" }}
        >
          <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: 0 }}>
            안전교육 이수 기록
          </h1>
          <p style={{ fontSize: "15px", marginTop: "4px", marginBottom: 0 }}>
            주식회사 원엔지니어링
          </p>
        </div>

        {/* ── 교육 기본 정보 ── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            marginBottom: "20px",
          }}
        >
          <tbody>
            <tr>
              <th style={thStyle}>교육명</th>
              <td style={{ ...tdStyle, fontWeight: "bold", fontSize: "14px" }}>
                {t.title}
              </td>
              <th style={thStyle}>출력일자</th>
              <td style={tdStyle}>{printDate}</td>
            </tr>
            <tr>
              <th style={thStyle}>총 대상 인원</th>
              <td style={tdStyle}>{allEmployees.length}명</td>
              <th style={thStyle}>완료 / 미완료</th>
              <td style={tdStyle}>
                완료 {completedCount}명 / 미완료 {pendingCount}명
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 교육 내용 ── */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>교육 내용</h2>
          {t.description && (
            <p style={{ fontSize: "12px", color: "#555", marginBottom: "6px" }}>
              {t.description}
            </p>
          )}
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "12px 16px",
              fontSize: "12px",
              lineHeight: "1.8",
              whiteSpace: "pre-wrap",
              background: "#fafafa",
            }}
          >
            {t.content}
          </div>
        </div>

        {/* ── O/X 퀴즈 ── */}
        {quizzes.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2 style={sectionTitleStyle}>O/X 퀴즈</h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ ...thStyle, width: "48px" }}>번호</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>문제</th>
                  <th style={{ ...thStyle, width: "56px" }}>정답</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      Q{i + 1}
                    </td>
                    <td style={tdStyle}>{q.question}</td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}
                    >
                      {q.answer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 이수 현황 서명부 ── */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={sectionTitleStyle}>이수 현황 서명부</h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ ...thStyle, width: "36px" }}>번호</th>
                <th style={{ ...thStyle, width: "70px" }}>이름</th>
                <th style={{ ...thStyle, width: "90px" }}>부서 / 직급</th>
                <th style={{ ...thStyle, width: "44px" }}>완료</th>
                <th style={{ ...thStyle, minWidth: "110px" }}>완료일시</th>
                <th style={{ ...thStyle, width: "52px" }}>퀴즈</th>
                <th style={{ ...thStyle, width: "100px" }}>전자서명</th>
              </tr>
            </thead>
            <tbody>
              {allEmployees.map((emp, idx) => {
                const a = assignmentMap.get(emp.id);
                const isCompleted = a?.status === "completed";
                const quizCorrect =
                  isCompleted && a?.quiz_answers
                    ? a.quiz_answers.filter(
                        (ans, i) => ans === quizzes[i]?.answer
                      ).length
                    : null;

                return (
                  <tr key={emp.id}>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {idx + 1}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: "500" }}>
                      {emp.name}
                    </td>
                    <td style={tdStyle}>{emp.department || "-"}</td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                        fontWeight: "bold",
                        color: isCompleted ? "#166534" : "#92400e",
                      }}
                    >
                      {isCompleted ? "✓" : "○"}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "11px" }}>
                      {a?.completed_at
                        ? new Date(a.completed_at).toLocaleString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {quizCorrect !== null
                        ? `${quizCorrect}/${quizzes.length}`
                        : "-"}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                        height: "54px",
                        padding: "3px",
                      }}
                    >
                      {a?.signature_data ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.signature_data}
                          alt={`${emp.name} 서명`}
                          style={{
                            maxHeight: "48px",
                            maxWidth: "94px",
                            margin: "0 auto",
                            display: "block",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#aaa" }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── 푸터 ── */}
        <div
          style={{
            borderTop: "1px solid #ccc",
            paddingTop: "10px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "#777",
          }}
        >
          <span>주식회사 원엔지니어링</span>
          <span>출력일시: {printDateTime}</span>
        </div>
      </div>
    </>
  );
}

// ── 공통 인라인 스타일 상수 ──
const thStyle: React.CSSProperties = {
  border: "1px solid #aaa",
  background: "#f3f4f6",
  padding: "6px 8px",
  textAlign: "left",
  fontWeight: "600",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #aaa",
  padding: "6px 8px",
  verticalAlign: "middle",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "bold",
  borderLeft: "4px solid #1d4ed8",
  paddingLeft: "10px",
  marginBottom: "10px",
  marginTop: 0,
};
