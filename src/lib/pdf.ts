import jsPDF from "jspdf";
import type { Employee, Training, TrainingAssignment } from "@/types";

type AssignmentWithEmployee = TrainingAssignment & { employees: Employee };

export async function generateTrainingReport(
  training: Training,
  assignments: AssignmentWithEmployee[]
) {
  const completed = assignments.filter((a) => a.status === "completed");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > 280) {
      doc.addPage();
      y = margin;
    }
  }

  // 제목
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Safety Training Record", pageW / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(13);
  doc.text("안전교육 이행 확인서", pageW / 2, y, { align: "center" });
  y += 12;

  // 구분선
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // 교육 정보 표
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const infoRows = [
    ["교육명", training.title],
    ["교육일", new Date().toLocaleDateString("ko-KR")],
    ["교육 인원", `${completed.length}명`],
  ];

  infoRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 30, y);
    y += 6;
  });

  y += 4;
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // 교육 내용
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("교육 내용", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const contentLines = doc.splitTextToSize(training.content, contentW);
  checkPageBreak(contentLines.length * 4.5 + 10);
  doc.text(contentLines, margin, y);
  y += contentLines.length * 4.5 + 8;

  // 서명부
  checkPageBreak(20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("서명부", margin, y);
  y += 6;

  // 테이블 헤더
  const colWidths = [30, 30, 35, 35, 50];
  const cols = ["이름", "부서", "완료일시", "퀴즈결과", "서명"];
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentW, 8, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  let colX = margin;
  cols.forEach((col, i) => {
    doc.text(col, colX + 2, y + 5.5);
    colX += colWidths[i];
  });
  y += 8;

  // 테이블 행
  doc.setFont("helvetica", "normal");
  for (const a of completed) {
    checkPageBreak(20);
    const rowH = 20;
    colX = margin;

    doc.rect(margin, y, contentW, rowH);

    const emp = a.employees;
    const quizCorrect = a.quiz_answers
      ? a.quiz_answers.filter(
          (ans, i) => ans === training.quizzes[i]?.answer
        ).length
      : 0;
    const completedDate = a.completed_at
      ? new Date(a.completed_at).toLocaleDateString("ko-KR")
      : "-";

    const rowData = [
      emp.name,
      emp.department || "-",
      completedDate,
      `${quizCorrect}/${training.quizzes.length}`,
    ];

    rowData.forEach((text, i) => {
      doc.text(String(text), colX + 2, y + 6);
      colX += colWidths[i];
    });

    // 서명 이미지
    if (a.signature_data) {
      try {
        const sigX = colX + 2;
        const sigY = y + 1;
        const sigW = colWidths[4] - 6;
        const sigH = rowH - 3;
        doc.addImage(a.signature_data, "PNG", sigX, sigY, sigW, sigH);
      } catch {
        doc.text("(서명)", colX + 2, y + 6);
      }
    } else {
      doc.text("-", colX + 2, y + 6);
    }

    y += rowH;
  }

  y += 10;
  checkPageBreak(10);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `생성일시: ${new Date().toLocaleString("ko-KR")}`,
    pageW - margin,
    y,
    { align: "right" }
  );

  const fileName = `안전교육_${training.title}_${new Date().toLocaleDateString("ko-KR").replace(/\./g, "").replace(/ /g, "")}.pdf`;
  doc.save(fileName);
}
