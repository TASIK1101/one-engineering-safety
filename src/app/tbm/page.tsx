export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Button from "@/components/ui/Button";
import TBMStatusBadge from "@/components/tbm/TBMStatusBadge";
import type { TbmRecord, TbmAttendee } from "@/types";

type RecordWithAttendees = TbmRecord & {
  tbm_attendees: Pick<TbmAttendee, "attendance_status">[];
};

export default async function TbmPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const [{ data: todayRecords }, { data: pendingRecords }] = await Promise.all([
    supabase
      .from("tbm_records")
      .select("*, tbm_attendees(attendance_status)")
      .eq("admin_id", user!.id)
      .eq("date", today)
      .order("created_at", { ascending: false }),
    supabase
      .from("tbm_records")
      .select("*, tbm_attendees(attendance_status)")
      .eq("admin_id", user!.id)
      .in("status", ["서명중", "검토중"])
      .neq("date", today)
      .order("date", { ascending: false })
      .limit(5),
  ]);

  const todayList = (todayRecords ?? []) as RecordWithAttendees[];
  const pendingList = (pendingRecords ?? []) as RecordWithAttendees[];

  const todayTotal = todayList.length;
  const todayCompleted = todayList.filter((r) => r.status === "완료").length;
  const todaySigning = todayList.filter((r) =>
    ["서명중", "검토중"].includes(r.status)
  ).length;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TBM 위험성평가 교육</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(today).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
        </div>
        <Link href="/tbm/new">
          <Button className="bg-green-600 hover:bg-green-700 text-sm px-5 py-2.5">
            + 새 TBM 작성
          </Button>
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <SummaryCard label="오늘 작성" value={todayTotal} unit="건" color="blue" />
        <SummaryCard label="서명 진행중" value={todaySigning} unit="건" color="amber" />
        <SummaryCard label="완료" value={todayCompleted} unit="건" color="green" />
      </div>

      {/* 오늘 TBM 목록 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          오늘 TBM
        </h2>
        {todayList.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-gray-700 mb-1">
              오늘 작성된 TBM이 없습니다
            </p>
            <p className="text-sm text-gray-400 mb-5">
              작업 시작 전 TBM 교육을 등록하세요.
            </p>
            <Link href="/tbm/new">
              <Button className="bg-green-600 hover:bg-green-700">
                + 새 TBM 작성
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {todayList.map((r) => (
              <TBMCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </section>

      {/* 진행 중 TBM (이전 날짜) */}
      {pendingList.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            진행 중 TBM (이전 날짜)
          </h2>
          <div className="flex flex-col gap-3">
            {pendingList.map((r) => (
              <TBMCard key={r.id} record={r} />
            ))}
          </div>
        </section>
      )}

      <div className="text-center pt-2">
        <Link
          href="/tbm/records"
          className="text-sm text-blue-600 hover:underline"
        >
          전체 TBM 기록 보관함 →
        </Link>
      </div>
    </div>
  );
}

// ── 요약 카드 ────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: "blue" | "amber" | "green";
}) {
  const colorMap = {
    blue: { border: "border-l-blue-500", text: "text-blue-600" },
    amber: { border: "border-l-amber-500", text: "text-amber-600" },
    green: { border: "border-l-green-500", text: "text-green-600" },
  };
  const { border, text } = colorMap[color];
  return (
    <div
      className={`rounded-xl bg-white border border-gray-200 border-l-4 ${border} p-4 shadow-sm`}
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${text}`}>
        {value}
        <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}

// ── TBM 카드 ─────────────────────────────────────────────────
function TBMCard({ record }: { record: RecordWithAttendees }) {
  const total = record.tbm_attendees?.length ?? 0;
  const signed =
    record.tbm_attendees?.filter((a) => a.attendance_status === "서명완료")
      .length ?? 0;

  return (
    <Link
      href={`/tbm/${record.id}`}
      className="block rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
    >
      {/* 상단 뱃지 줄 */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <TBMStatusBadge status={record.status} />
        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
          {record.work_type}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            record.education_done
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-50 text-gray-400 border border-gray-200"
          }`}
        >
          교육 {record.education_done ? "실시" : "미실시"}
        </span>
      </div>

      {/* 본문 */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-base leading-snug">
            {record.worksite_location || "위치 미입력"}
            {record.process_name && (
              <span className="font-normal text-gray-500 ml-1.5 text-sm">
                · {record.process_name}
              </span>
            )}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">{record.date}</p>
        </div>

        {/* 참석자 수 */}
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-400 mb-0.5">참석자</p>
          <p className="text-sm font-semibold">
            <span className="text-green-600">{signed}</span>
            <span className="text-gray-400">/{total}명</span>
          </p>
        </div>
      </div>

      <p className="text-xs text-blue-600 mt-3 font-medium">상세 보기 →</p>
    </Link>
  );
}
