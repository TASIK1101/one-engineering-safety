export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import PrintStyles from "@/components/print/PrintStyles";
import PrintButtonBar from "@/components/print/PrintButtonBar";
import WorkPermitPrintDocument from "@/components/print/documents/WorkPermitPrintDocument";
import PreviewNav from "../_components/PreviewNav";
import {
  printPreviewEnabled,
  parsePreviewCount,
  parsePermitScenario,
  PERMIT_SCENARIOS,
  PERMIT_SCENARIO_LABELS,
  mockWorkPermit,
  mockPermitItems,
  mockPermitWorkers,
  mockPermitApprovals,
  mockGasMeasurements,
  mockEntryLogs,
  mockAgreements,
} from "@/lib/dev/print-preview-mock";

export default async function WorkPermitPrintPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ count?: string; scenario?: string }>;
}) {
  if (!printPreviewEnabled()) notFound();

  const { count: rawCount, scenario: rawScenario } = await searchParams;
  const count = parsePreviewCount(rawCount);
  const scenario = parsePermitScenario(rawScenario);

  const permit = mockWorkPermit(scenario);
  const workers = mockPermitWorkers(count);

  return (
    <>
      <PrintStyles />
      <PreviewNav
        basePath="/dev/print-preview/work-permit"
        title="작업허가서 인쇄 테스트"
        currentCount={count}
        currentScenario={scenario}
        scenarios={PERMIT_SCENARIOS.map((s) => ({
          value: s,
          label: PERMIT_SCENARIO_LABELS[s],
        }))}
      />
      <PrintButtonBar
        backHref="/dev/print-preview"
        backLabel="← 테스트 홈"
        pageTitle={`작업허가서 (mock · ${PERMIT_SCENARIO_LABELS[scenario]} · ${count}명)`}
        hasAppendix={workers.length > 0}
      />
      <WorkPermitPrintDocument
        permit={permit}
        items={mockPermitItems()}
        workers={workers}
        approvals={mockPermitApprovals(scenario)}
        gasMeasurements={mockGasMeasurements(scenario)}
        entryLogs={mockEntryLogs(scenario)}
        agreements={mockAgreements(scenario)}
      />
    </>
  );
}
