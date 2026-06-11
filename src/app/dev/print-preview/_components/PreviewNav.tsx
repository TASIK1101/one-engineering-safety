import Link from "next/link";
import { PREVIEW_COUNTS } from "@/lib/dev/print-preview-mock";

interface ScenarioOption {
  value: string;
  label: string;
}

interface Props {
  basePath: string;
  title: string;
  currentCount: number;
  scenarios?: ScenarioOption[];
  currentScenario?: string;
}

function buildQuery(count: number, scenario?: string): string {
  const params = new URLSearchParams({ count: String(count) });
  if (scenario) params.set("scenario", scenario);
  return `?${params.toString()}`;
}

export default function PreviewNav({
  basePath,
  title,
  currentCount,
  scenarios,
  currentScenario,
}: Props) {
  return (
    <div className="no-print bg-amber-50 border-b-2 border-amber-300 px-6 py-3">
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <Link href="/dev/print-preview" className="text-sm text-gray-500 hover:text-gray-800">
          ← 인쇄 테스트 홈
        </Link>
        <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded">
          ⚠ 개발·Preview 전용 — mock 데이터 (운영 DB 미사용)
        </span>
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-600">서명자 수:</span>
        {PREVIEW_COUNTS.map((c) => (
          <Link
            key={c}
            href={`${basePath}${buildQuery(c, currentScenario)}`}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
              c === currentCount
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {c}명
          </Link>
        ))}
        {currentCount === 0 && (
          <span className="text-xs text-gray-500">
            — 0명: 서명 부록 없음, 본문만 출력됩니다.
          </span>
        )}
      </div>

      {scenarios && scenarios.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-xs font-semibold text-gray-600">시나리오:</span>
          {scenarios.map((s) => (
            <Link
              key={s.value}
              href={`${basePath}${buildQuery(currentCount, s.value)}`}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                s.value === currentScenario
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
