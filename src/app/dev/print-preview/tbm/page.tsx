export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import PrintStyles from "@/components/print/PrintStyles";
import PrintButtonBar from "@/components/print/PrintButtonBar";
import TbmPrintDocument from "@/components/print/documents/TbmPrintDocument";
import PreviewNav from "../_components/PreviewNav";
import {
  printPreviewEnabled,
  parsePreviewCount,
  mockTbmRecord,
  mockTbmAttendees,
  mockTbmApprovals,
} from "@/lib/dev/print-preview-mock";

export default async function TbmPrintPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ count?: string }>;
}) {
  if (!printPreviewEnabled()) notFound();

  const { count: rawCount } = await searchParams;
  const count = parsePreviewCount(rawCount);

  const tbm = mockTbmRecord();
  const attendees = mockTbmAttendees(count);
  const approvals = mockTbmApprovals();

  return (
    <>
      <PrintStyles />
      <PreviewNav
        basePath="/dev/print-preview/tbm"
        title="TBM 기록 인쇄 테스트"
        currentCount={count}
      />
      <PrintButtonBar
        backHref="/dev/print-preview"
        backLabel="← 테스트 홈"
        pageTitle={`TBM (mock · ${count}명)`}
        hasAppendix={attendees.length > 0}
      />
      <TbmPrintDocument tbm={tbm} attendees={attendees} approvals={approvals} />
    </>
  );
}
