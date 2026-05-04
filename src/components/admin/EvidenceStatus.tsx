type Props = {
  hasContent: boolean;
  hasEmployees: boolean;
  completedCount: number;
  totalCount: number;
  hasSignatures: boolean;
  hasConfirmation: boolean;
};

export default function EvidenceStatus({
  hasContent,
  hasEmployees,
  completedCount,
  totalCount,
  hasSignatures,
  hasConfirmation,
}: Props) {
  const pendingCount = totalCount - completedCount;

  const checks = [
    { label: "교육 내용 있음", ok: hasContent },
    { label: "교육 대상자 있음", ok: hasEmployees },
    {
      label:
        completedCount > 0
          ? `이수 완료자 있음 (${completedCount}/${totalCount}명)`
          : "이수 완료자 없음",
      ok: completedCount > 0,
    },
    { label: "전자서명 있음", ok: hasSignatures },
    { label: "교육 담당자 확인 있음", ok: hasConfirmation },
    { label: "출력 가능", ok: true },
  ];

  const issues: string[] = [];
  if (pendingCount > 0) issues.push(`미이수자 ${pendingCount}명 있음`);
  if (!hasConfirmation) issues.push("교육 담당자 확인 없음");

  const isGood = issues.length === 0;

  return (
    <div
      className={`rounded-xl p-4 shadow-sm mb-5 border ${
        isGood
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-sm font-semibold ${
            isGood ? "text-green-800" : "text-amber-800"
          }`}
        >
          기록 상태:{" "}
          {isGood ? (
            <span className="text-green-700">양호</span>
          ) : (
            <span className="text-amber-700">보완 필요</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs mb-2">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <span
              className={`shrink-0 ${c.ok ? "text-green-600" : "text-gray-400"}`}
            >
              {c.ok ? "✓" : "○"}
            </span>
            <span className={c.ok ? "text-gray-700" : "text-gray-400"}>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {issues.length > 0 && (
        <div className="border-t border-amber-200 pt-2 mt-2">
          <p className="text-xs font-medium text-amber-700 mb-1">보완 필요 항목</p>
          <ul className="flex flex-col gap-0.5">
            {issues.map((issue) => (
              <li key={issue} className="text-xs text-amber-700 flex items-center gap-1">
                <span>•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
