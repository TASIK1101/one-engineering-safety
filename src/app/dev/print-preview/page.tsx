export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { printPreviewEnabled } from "@/lib/dev/print-preview-mock";

const MODULES = [
  {
    href: "/dev/print-preview/tbm",
    title: "TBM 기록",
    desc: "참석자 서명부 별첨 — 본문 A4 세로 / 부록 A4 가로",
  },
  {
    href: "/dev/print-preview/training",
    title: "안전교육 이수기록",
    desc: "직원별 이수 현황 서명부 별첨 — 일부 미이수 케이스 포함",
  },
  {
    href: "/dev/print-preview/work-permit",
    title: "작업허가서",
    desc: "작업 인원 서명부 별첨 + 일반/밀폐구역/레일/반려 시나리오",
  },
];

export default function PrintPreviewIndexPage() {
  if (!printPreviewEnabled()) notFound();

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded">
            ⚠ 개발·Preview 전용
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">인쇄 구조 테스트 (mock 데이터)</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            운영 DB를 조회하지 않고 코드 내부 mock 데이터만으로 인쇄 미리보기를 검증합니다.
            각 페이지 상단에서 서명자 수(0 / 1 / 10 / 25 / 50 / 55 / 70명)를 선택할 수 있으며,
            &quot;본문 인쇄&quot;와 &quot;서명 부록 인쇄&quot; 버튼이 실제 인쇄 페이지와 동일하게 작동합니다.
            브라우저 자체 인쇄(Ctrl+P) 시에는 본문과 부록이 함께 출력됩니다.
          </p>
        </div>

        <div className="space-y-3">
          {MODULES.map((m) => (
            <Link
              key={m.href}
              href={`${m.href}?count=55`}
              className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <p className="text-base font-semibold text-gray-900">{m.title}</p>
              <p className="text-sm text-gray-500 mt-1">{m.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800 mb-2">확인 체크리스트</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>본문 인쇄 시 서명 부록이 출력되지 않는가</li>
            <li>서명 부록 인쇄 시 본문이 출력되지 않는가</li>
            <li>서명 부록이 A4 가로로 출력되는가</li>
            <li>55명 / 70명에서 자동으로 여러 페이지로 분할되는가</li>
            <li>페이지가 넘어가도 표 헤더가 반복되는가</li>
            <li>서명 이미지가 행 중간에서 잘리지 않는가</li>
            <li>빈 페이지가 생기지 않는가</li>
            <li>0명일 때 오류 없이 본문만 출력되는가</li>
            <li>출력 취소 후 화면이 정상 복구되는가</li>
            <li>작업허가서의 승인자 영역(본문)과 작업자 서명부(부록)가 섞이지 않는가</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
