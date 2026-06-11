export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import PrintStyles from "@/components/print/PrintStyles";
import PrintButtonBar from "@/components/print/PrintButtonBar";
import TrainingPrintDocument from "@/components/print/documents/TrainingPrintDocument";
import PreviewNav from "../_components/PreviewNav";
import {
  printPreviewEnabled,
  parsePreviewCount,
  mockTraining,
  mockEmployees,
  mockTrainingAssignments,
} from "@/lib/dev/print-preview-mock";

export default async function TrainingPrintPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ count?: string }>;
}) {
  if (!printPreviewEnabled()) notFound();

  const { count: rawCount } = await searchParams;
  const count = parsePreviewCount(rawCount);

  const training = mockTraining();
  const employees = mockEmployees(count);
  const assignments = mockTrainingAssignments(employees);

  return (
    <>
      <PrintStyles />
      <PreviewNav
        basePath="/dev/print-preview/training"
        title="안전교육 이수기록 인쇄 테스트"
        currentCount={count}
      />
      <PrintButtonBar
        backHref="/dev/print-preview"
        backLabel="← 테스트 홈"
        pageTitle={`안전교육 (mock · ${count}명)`}
        hasAppendix={employees.length > 0}
      />
      <TrainingPrintDocument
        training={training}
        employees={employees}
        assignments={assignments}
      />
    </>
  );
}
