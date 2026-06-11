"use client";
import Link from "next/link";

interface Props {
  backHref: string;
  backLabel?: string;
  pageTitle?: string;
  hasAppendix?: boolean;
}

export default function PrintButtonBar({
  backHref,
  backLabel = "← 돌아가기",
  pageTitle,
  hasAppendix = true,
}: Props) {
  function printBody() {
    document.body.classList.add("printing-body");
    window.addEventListener(
      "afterprint",
      () => document.body.classList.remove("printing-body"),
      { once: true }
    );
    window.print();
  }

  function printAppendix() {
    document.body.classList.add("printing-appendix");
    window.addEventListener(
      "afterprint",
      () => document.body.classList.remove("printing-appendix"),
      { once: true }
    );
    window.print();
  }

  return (
    <div className="no-print sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href={backHref} className="text-sm text-gray-500 hover:text-gray-800">
          {backLabel}
        </Link>
        {pageTitle && (
          <span className="text-sm font-semibold text-gray-800">{pageTitle}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={printBody}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          🖨️ 본문 인쇄
        </button>
        {hasAppendix && (
          <button
            onClick={printAppendix}
            className="inline-flex items-center gap-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            📋 서명 부록 인쇄
          </button>
        )}
      </div>
    </div>
  );
}
