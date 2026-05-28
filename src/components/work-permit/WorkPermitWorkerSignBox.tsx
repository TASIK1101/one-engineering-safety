import type { WorkPermitWorker } from "@/types";
import WorkPermitSignLinkBox from "@/components/work-permit/WorkPermitSignLinkBox";

export default function WorkPermitWorkerSignBox({
  workers,
  isLocked,
  isRejected,
  permitToken,
}: {
  workers: WorkPermitWorker[];
  isLocked: boolean;
  isRejected: boolean;
  permitToken: string;
}) {
  const signedCount = workers.filter((w) => w.signed_at).length;

  return (
    <section className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          👷 작업 인원 서명 현황
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-green-600 font-semibold">
            서명완료 {signedCount}명
          </span>
          <span className="text-amber-600">
            대기 {workers.length - signedCount}명
          </span>
        </div>
      </div>

      {workers.length === 0 ? (
        <p className="text-gray-400 text-sm">등록된 작업자가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {workers.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {w.worker_name}
                  {w.is_manual && w.company_name && (
                    <span className="ml-1.5 text-xs text-gray-400">
                      ({w.company_name})
                    </span>
                  )}
                </p>
                {w.signed_at && (
                  <p className="text-xs text-gray-400">
                    {new Date(w.signed_at).toLocaleString("ko-KR")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {w.signature_data && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={w.signature_data}
                    alt={`${w.worker_name} 서명`}
                    className="h-8 border border-gray-200 rounded bg-white px-1"
                  />
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    w.signed_at
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {w.signed_at ? "서명완료" : "대기"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLocked && !isRejected && (
        <WorkPermitSignLinkBox permitToken={permitToken} />
      )}
    </section>
  );
}
