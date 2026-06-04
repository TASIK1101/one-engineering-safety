export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

type Status = "ok" | "warn" | "error";

function Badge({ status }: { status: Status }) {
  const styles = {
    ok:    "bg-green-100 text-green-800 border border-green-200",
    warn:  "bg-amber-100 text-amber-800 border border-amber-200",
    error: "bg-red-100 text-red-700 border border-red-200",
  };
  const labels = { ok: "정상", warn: "미설정", error: "오류" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function Row({ label, status, detail }: { label: string; status: Status; detail?: string }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2.5 pr-4 text-sm font-medium text-gray-700 whitespace-nowrap">{label}</td>
      <td className="py-2.5 pr-4"><Badge status={status} /></td>
      <td className="py-2.5 text-sm text-gray-500">{detail ?? ""}</td>
    </tr>
  );
}

export default async function SystemCheckPage() {
  const now = new Date().toLocaleString("ko-KR");
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "로컬/알 수 없음";
  const productionUrl = "https://one-engineering-safety.vercel.app";

  // ── 환경변수 점검 ─────────────────────────────────────────
  const envChecks = [
    {
      label: "NEXT_PUBLIC_SUPABASE_URL",
      set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      preview: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/https:\/\/([^.]+).*/, "https://$1…")
        : "",
    },
    {
      label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      preview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "eyJ…[설정됨]" : "",
    },
    {
      label: "SUPABASE_SERVICE_ROLE_KEY",
      set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      preview: process.env.SUPABASE_SERVICE_ROLE_KEY ? "eyJ…[설정됨, 비공개]" : "",
    },
    {
      label: "NEXT_PUBLIC_APP_URL",
      set: !!process.env.NEXT_PUBLIC_APP_URL,
      preview: process.env.NEXT_PUBLIC_APP_URL ?? "(미설정 — window.location.origin 사용)",
    },
  ];

  // ── DB 테이블 조회 점검 ────────────────────────────────────
  const TABLE_LIST = [
    { key: "employees",          label: "직원 (employees)" },
    { key: "tbm_records",        label: "TBM 기록 (tbm_records)" },
    { key: "work_permits",       label: "작업허가서 (work_permits)" },
    { key: "safety_inspections", label: "안전점검 (safety_inspections)" },
    { key: "corrective_actions", label: "시정조치 (corrective_actions)" },
    { key: "ppe_items",          label: "보호구 품목 (ppe_items)" },
    { key: "ppe_issuances",      label: "보호구 지급 (ppe_issuances)" },
    { key: "emergency_contacts", label: "비상연락망 (emergency_contacts)" },
    { key: "emergency_equipment", label: "비상장비 (emergency_equipment)" },
    { key: "emergency_scenarios", label: "비상시나리오 (emergency_scenarios)" },
    { key: "stop_work_records",  label: "작업중지 (stop_work_records)" },
    { key: "emergency_drills",   label: "비상훈련 (emergency_drills)" },
  ];

  const BUCKETS_EXPECTED = ["safety-photos", "ppe-certificates", "emergency-files"];

  type TableResult = { label: string; status: Status; detail: string };
  type BucketResult = { name: string; status: Status };

  let tableResults: TableResult[] = [];
  let bucketResults: BucketResult[] = [];
  let dbConnected = false;

  try {
    const admin = createAdminClient();

    const results = await Promise.allSettled(
      TABLE_LIST.map((t) =>
        admin.from(t.key as "employees").select("id", { count: "exact", head: true })
      )
    );

    dbConnected = true;

    tableResults = TABLE_LIST.map((t, i) => {
      const r = results[i];
      if (r.status === "fulfilled" && r.value.error === null) {
        return { label: t.label, status: "ok" as Status, detail: `${r.value.count ?? 0}건` };
      }
      const errMsg = r.status === "fulfilled" ? r.value.error?.message : String((r as PromiseRejectedResult).reason);
      return { label: t.label, status: "error" as Status, detail: errMsg ?? "조회 실패" };
    });

    const { data: buckets, error: bucketsErr } = await admin.storage.listBuckets();
    if (!bucketsErr && buckets) {
      const bucketNames = buckets.map((b) => b.name);
      bucketResults = BUCKETS_EXPECTED.map((name) => ({
        name,
        status: (bucketNames.includes(name) ? "ok" : "error") as Status,
      }));
    }
  } catch {
    dbConnected = false;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">시스템 점검</h1>
          <p className="text-sm text-gray-500 mt-0.5">점검 시각: {now}</p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          ← 대시보드
        </Link>
      </div>

      {/* 앱 정보 */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">앱 정보</h2>
        <table className="w-full">
          <tbody>
            <Row label="커밋 해시" status="ok" detail={commitSha} />
            <Row label="Production URL" status="ok" detail={productionUrl} />
            <Row label="점검일시" status="ok" detail={now} />
          </tbody>
        </table>
      </section>

      {/* 환경변수 */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">환경변수 (값 비공개, 존재 여부만 표시)</h2>
        <table className="w-full">
          <tbody>
            {envChecks.map((e) => (
              <Row
                key={e.label}
                label={e.label}
                status={e.set ? "ok" : "warn"}
                detail={e.set ? e.preview : "미설정"}
              />
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-400">
          * SUPABASE_SERVICE_ROLE_KEY 실제 값은 절대 화면에 표시되지 않습니다.
        </p>
      </section>

      {/* DB 연결 */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-900">데이터베이스 연결</h2>
          <Badge status={dbConnected ? "ok" : "error"} />
        </div>
        {dbConnected ? (
          <table className="w-full">
            <tbody>
              {tableResults.map((r) => (
                <Row key={r.label} label={r.label} status={r.status} detail={r.detail} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-red-600">Supabase 연결 실패 — SUPABASE_SERVICE_ROLE_KEY 또는 NEXT_PUBLIC_SUPABASE_URL 환경변수를 확인하세요.</p>
        )}
      </section>

      {/* Storage Bucket */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Storage Bucket</h2>
        {bucketResults.length > 0 ? (
          <table className="w-full">
            <tbody>
              {bucketResults.map((b) => (
                <Row
                  key={b.name}
                  label={b.name}
                  status={b.status}
                  detail={b.status === "ok" ? "버킷 존재 확인됨" : "버킷 없음 — SQL 마이그레이션 실행 필요"}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">DB 연결 실패로 버킷 조회 불가</p>
        )}
      </section>

      {/* 안내사항 */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">현장 베타 배포 전 체크리스트</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700">
          <li>모든 환경변수 ✅ 상태인지 확인</li>
          <li>모든 DB 테이블 조회 ✅ 상태인지 확인</li>
          <li>Storage Bucket 3개 ✅ 상태인지 확인</li>
          <li>Supabase SQL Editor에서 emergency_module.sql 실행 완료 여부 확인</li>
          <li>Supabase SQL Editor에서 emergency_seed.sql 실행 완료 여부 확인 (시나리오 5건 등록)</li>
          <li>관리자 계정으로 로그인 → 대시보드 정상 로딩 확인</li>
          <li>TBM 서명 링크 공유 후 모바일에서 서명 테스트</li>
        </ul>
      </section>
    </div>
  );
}
