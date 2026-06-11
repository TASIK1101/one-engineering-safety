export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintStyles from "@/components/print/PrintStyles";
import PrintDocumentHeader from "@/components/print/PrintDocumentHeader";
import PrintDocumentFooter from "@/components/print/PrintDocumentFooter";
import PrintButtonBar from "@/components/print/PrintButtonBar";
import { thStyle, tdStyle, sectionTitleStyle } from "@/components/print/printStyleConstants";
import type {
  WorkPermit,
  WorkPermitItem,
  WorkPermitWorker,
  WorkPermitApproval,
  WorkPermitGasMeasurement,
  ConfinedSpaceEntryLog,
  RelatedCompanyAgreement,
} from "@/types";
import { isConfinedSpace, isRailWork } from "@/lib/work-permit-types";

export default async function WorkPermitPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: permit } = await supabase
    .from("work_permits")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!permit) notFound();

  const p = permit as WorkPermit;
  const confined = isConfinedSpace(p.permit_type);
  const railWork = isRailWork(p.permit_type);

  const [
    { data: items },
    { data: workers },
    { data: approvals },
    { data: gasMeasurements },
    { data: entryLogs },
    { data: agreements },
  ] = await Promise.all([
    supabase.from("work_permit_items").select("*").eq("permit_id", id).order("created_at"),
    supabase.from("work_permit_workers").select("*").eq("permit_id", id).order("created_at"),
    supabase.from("work_permit_approvals").select("*").eq("permit_id", id).order("created_at"),
    supabase.from("work_permit_gas_measurements").select("*").eq("permit_id", id).order("measured_at"),
    confined
      ? supabase.from("confined_space_entry_logs").select("*").eq("permit_id", id).order("entry_time", { ascending: true })
      : Promise.resolve({ data: [] }),
    railWork
      ? supabase.from("related_company_agreements").select("*").eq("permit_id", id).order("created_at")
      : Promise.resolve({ data: [] }),
  ]);

  const checklistItems = (items ?? []) as WorkPermitItem[];
  const workerList = (workers ?? []) as WorkPermitWorker[];
  const approvalList = (approvals ?? []) as WorkPermitApproval[];
  const gasList = (gasMeasurements ?? []) as WorkPermitGasMeasurement[];
  const logList = (entryLogs ?? []) as ConfinedSpaceEntryLog[];
  const agreementList = (agreements ?? []) as RelatedCompanyAgreement[];

  const grouped = checklistItems.reduce<Record<string, WorkPermitItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const APPROVAL_ROLES = ["작성자", "안전전담자", "소장대표"] as const;
  const printDate = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <PrintStyles />
      <PrintButtonBar
        backHref={`/work-permits/${id}`}
        backLabel="← 돌아가기"
        pageTitle="작업허가서 출력"
        hasAppendix={workerList.length > 0}
      />

      {/* ── 본문 섹션 (A4 세로) ── */}
      <div className="print-body-section mx-auto bg-white px-10 py-8 print:px-0 print:py-0" style={{ maxWidth: "210mm" }}>
        <PrintDocumentHeader
          title={`${p.grade}급 작업허가서`}
          subtitle={p.permit_type}
          docNumber="Work Permit"
        />

        {/* 기본 정보 */}
        <section style={{ marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>기본 정보</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <tbody>
              <tr>
                <th style={thStyle}>작업명</th>
                <td style={{ ...tdStyle, fontWeight: "bold", fontSize: "13px" }} colSpan={3}>
                  {p.work_name || "-"}
                </td>
              </tr>
              <tr>
                <th style={thStyle}>허가 등급/유형</th>
                <td style={tdStyle}>{p.grade}급 — {p.permit_type}</td>
                <th style={thStyle}>상태</th>
                <td style={{ ...tdStyle, fontWeight: "bold" }}>{p.status}</td>
              </tr>
              <tr>
                <th style={thStyle}>작업협력사</th>
                <td style={tdStyle}>{p.work_company || "-"}</td>
                <th style={thStyle}>주관작업부서</th>
                <td style={tdStyle}>{p.work_department || "-"}</td>
              </tr>
              <tr>
                <th style={thStyle}>작업장소</th>
                <td style={tdStyle} colSpan={3}>{p.work_location || "-"}</td>
              </tr>
              <tr>
                <th style={thStyle}>작업기간</th>
                <td style={tdStyle}>
                  {p.work_period_start || "-"}
                  {p.work_period_end ? ` ~ ${p.work_period_end}` : ""}
                </td>
                <th style={thStyle}>작업인원</th>
                <td style={tdStyle}>{p.worker_count ? `${p.worker_count}명` : "-"}</td>
              </tr>
              <tr>
                <th style={thStyle}>관리감독자</th>
                <td style={tdStyle}>{p.supervisor_name || "-"}</td>
                <th style={thStyle}>비상연락망</th>
                <td style={tdStyle}>{p.emergency_contact || "-"}</td>
              </tr>
              {confined && (
                <>
                  <tr>
                    <th style={thStyle}>환기방법</th>
                    <td style={tdStyle} colSpan={3}>{p.ventilation_method || "-"}</td>
                  </tr>
                  <tr>
                    <th style={thStyle}>감시자</th>
                    <td style={tdStyle} colSpan={3}>{p.watcher_name || "-"}</td>
                  </tr>
                </>
              )}
              <tr>
                <th style={thStyle}>출력일자</th>
                <td style={tdStyle} colSpan={3}>{printDate}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 체크리스트 */}
        {checklistItems.length > 0 && (
          <section style={{ marginBottom: "20px" }}>
            <h2 style={sectionTitleStyle}>작업 전 체크리스트</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ ...thStyle, width: "30%" }}>구분</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>항목</th>
                  <th style={{ ...thStyle, width: "70px", textAlign: "center" }}>신청/해당없음</th>
                  <th style={{ ...thStyle, width: "60px", textAlign: "center" }}>현장확인</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([category, catItems]) =>
                  catItems.map((item, idx) => (
                    <tr key={item.id}>
                      {idx === 0 && (
                        <td style={{ ...tdStyle, fontWeight: "600", background: "#f9fafb", verticalAlign: "middle" }}
                          rowSpan={catItems.length}>
                          {category}
                        </td>
                      )}
                      <td style={{
                        ...tdStyle,
                        color: item.apply_status === "해당없음" ? "#aaa" : "#000",
                        textDecoration: item.apply_status === "해당없음" ? "line-through" : "none",
                      }}>
                        {item.item_text}
                      </td>
                      <td style={{
                        ...tdStyle, textAlign: "center", fontWeight: "600",
                        color: item.apply_status === "신청" ? "#1d4ed8" : "#9ca3af",
                      }}>
                        {item.apply_status}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {item.field_confirmed ? "✓" : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* 밀폐구역: 가스 측정 */}
        {confined && (
          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ ...sectionTitleStyle, borderLeftColor: "#0891b2" }}>가스 농도 측정 기록</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "#f0f9ff" }}>
                  <th style={{ ...thStyle, width: "140px" }}>측정 시각</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>산소 (%)</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>가연성가스 (%LEL)</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>CO (ppm)</th>
                  <th style={thStyle}>측정자</th>
                </tr>
              </thead>
              <tbody>
                {gasList.length > 0 ? (
                  gasList.map((m) => (
                    <tr key={m.id}>
                      <td style={tdStyle}>
                        {new Date(m.measured_at).toLocaleString("ko-KR", {
                          month: "2-digit", day: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{m.oxygen ?? "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{m.combustible_gas ?? "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{m.carbon_monoxide ?? "-"}</td>
                      <td style={tdStyle}>{m.measured_by ?? "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#aaa", height: "40px" }}>
                      측정 기록 없음
                    </td>
                  </tr>
                )}
                {[...Array(Math.max(0, 3 - gasList.length))].map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td style={{ ...tdStyle, height: "28px" }} />
                    <td style={tdStyle} />
                    <td style={tdStyle} />
                    <td style={tdStyle} />
                    <td style={tdStyle} />
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: "10px", color: "#888", marginTop: "4px" }}>
              기준값: 산소 18~23.5% / 가연성가스 LEL 10% 이하 / CO 25ppm 이하
            </p>
          </section>
        )}

        {/* 밀폐구역: 출입 관리대장 */}
        {confined && (
          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ ...sectionTitleStyle, borderLeftColor: "#f97316" }}>밀폐구역 출입 관리대장</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "#fff7ed" }}>
                  <th style={{ ...thStyle, width: "28px", textAlign: "center" }}>No</th>
                  <th style={{ ...thStyle, width: "70px" }}>작업자명</th>
                  <th style={{ ...thStyle, width: "120px", textAlign: "center" }}>입실 시간</th>
                  <th style={{ ...thStyle, width: "120px", textAlign: "center" }}>퇴실 시간</th>
                  <th style={thStyle}>비고</th>
                </tr>
              </thead>
              <tbody>
                {logList.length > 0 ? (
                  logList.map((log, idx) => (
                    <tr key={log.id}>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: "500" }}>{log.worker_name}</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {log.entry_time
                          ? new Date(log.entry_time).toLocaleString("ko-KR", {
                              month: "2-digit", day: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {log.exit_time
                          ? new Date(log.exit_time).toLocaleString("ko-KR", {
                              month: "2-digit", day: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td style={tdStyle}>{log.note ?? "-"}</td>
                    </tr>
                  ))
                ) : (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, textAlign: "center", height: "28px" }}>{i + 1}</td>
                      <td style={tdStyle} />
                      <td style={tdStyle} />
                      <td style={tdStyle} />
                      <td style={tdStyle} />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* 레일 위 작업: 관련 협력사 합의 */}
        {railWork && (
          <section style={{ marginBottom: "20px" }}>
            <h2 style={{ ...sectionTitleStyle, borderLeftColor: "#7c3aed" }}>관련 협력사 합의</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "#faf5ff" }}>
                  <th style={{ ...thStyle, width: "28px", textAlign: "center" }}>No</th>
                  <th style={{ ...thStyle, width: "120px" }}>협력사명</th>
                  <th style={{ ...thStyle, width: "80px" }}>담당자명</th>
                  <th style={{ ...thStyle, width: "100px", textAlign: "center" }}>서명</th>
                  <th style={thStyle}>서명일시</th>
                </tr>
              </thead>
              <tbody>
                {agreementList.length > 0 ? (
                  agreementList.map((agr, idx) => (
                    <tr key={agr.id}>
                      <td style={{ ...tdStyle, textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: "500" }}>{agr.company_name}</td>
                      <td style={tdStyle}>{agr.contact_name ?? "-"}</td>
                      <td style={{ ...tdStyle, textAlign: "center", height: "50px", padding: "3px" }}>
                        {agr.signature_data ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={agr.signature_data}
                            alt="서명"
                            style={{ maxHeight: "44px", maxWidth: "90px", margin: "0 auto", display: "block" }}
                          />
                        ) : (
                          <span style={{ color: "#aaa" }}>(서명란)</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontSize: "10px" }}>
                        {agr.signed_at ? new Date(agr.signed_at).toLocaleString("ko-KR") : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  [...Array(2)].map((_, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, textAlign: "center", height: "50px" }}>{i + 1}</td>
                      <td style={tdStyle} />
                      <td style={tdStyle} />
                      <td style={tdStyle} />
                      <td style={tdStyle} />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* 승인 서명란 */}
        <section style={{ marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>승인 서명란</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                {APPROVAL_ROLES.map((role) => (
                  <th key={role} style={{ ...thStyle, width: "33.33%", textAlign: "center" }}>{role}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {APPROVAL_ROLES.map((role) => {
                  const a = approvalList.find((x) => x.approver_role === role);
                  return (
                    <td key={role} style={{ ...tdStyle, height: "80px", textAlign: "center", verticalAlign: "middle", padding: "6px" }}>
                      {a?.signature_data ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.signature_data}
                          alt={`${a.approver_name} 서명`}
                          style={{ maxHeight: "68px", maxWidth: "140px", margin: "0 auto", display: "block" }}
                        />
                      ) : (
                        <span style={{ color: "#ccc", fontSize: "11px" }}>미서명</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                {APPROVAL_ROLES.map((role) => {
                  const a = approvalList.find((x) => x.approver_role === role);
                  return (
                    <td key={role} style={{ ...tdStyle, textAlign: "center", fontSize: "11px" }}>
                      {a?.approver_name ? (
                        <>
                          <div style={{ fontWeight: "600", marginBottom: "2px" }}>{a.approver_name}</div>
                          <div style={{ color: "#666", fontSize: "10px" }}>
                            {a.approval_status === "승인" && a.approved_at
                              ? new Date(a.approved_at).toLocaleString("ko-KR")
                              : a.approval_status === "반려"
                              ? `반려 (${a.approved_at ? new Date(a.approved_at).toLocaleString("ko-KR") : "-"})`
                              : "승인 대기"}
                          </div>
                          {a.approval_status === "반려" && a.rejection_reason && (
                            <div style={{ color: "#b91c1c", fontSize: "10px", marginTop: "2px" }}>
                              사유: {a.rejection_reason}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "#bbb" }}>승인 대기</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
          {p.rejection_reason && (
            <div style={{ marginTop: "8px", padding: "8px 12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", fontSize: "11px", color: "#b91c1c" }}>
              <strong>반려 사유:</strong> {p.rejection_reason}
            </div>
          )}
        </section>

        {/* 비고 */}
        <section style={{ marginBottom: "16px" }}>
          <h2 style={sectionTitleStyle}>비고</h2>
          <div style={{
            border: "1px solid #ccc", borderRadius: "4px",
            padding: "10px 14px", minHeight: "60px",
            fontSize: "11px", color: "#555", lineHeight: "1.6",
          }}>
            본 문서는 안전교육 이행 기록 및 서명 증빙 관리를 위해 생성되었습니다.
            작업 전 체크리스트 확인 및 작업자 서명 기록을 보관합니다.
          </div>
        </section>

        <PrintDocumentFooter />
      </div>

      {/* ── 서명 부록 (A4 가로, 작업 인원) ── */}
      {workerList.length > 0 && (
        <div className="print-appendix-section mx-auto bg-white px-10 py-8 print:px-0 print:py-0 mt-8" style={{ maxWidth: "270mm" }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "12px", marginBottom: "16px" }}>
            <p style={{ fontSize: "11px", color: "#555", letterSpacing: "1px", marginBottom: "4px" }}>
              주식회사 원엔지니어링 — {p.grade}급 작업허가서 {p.permit_type}
            </p>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "4px 0" }}>별첨 1 · 작업 인원 서명부</h2>
            <p style={{ fontSize: "11px", color: "#777", margin: 0 }}>Worker Signature Appendix</p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ ...thStyle, width: "28px", textAlign: "center" }}>No</th>
                <th style={{ ...thStyle, width: "80px" }}>이름</th>
                <th style={{ ...thStyle, width: "70px" }}>소속회사</th>
                <th style={{ ...thStyle, width: "60px", textAlign: "center" }}>서명 상태</th>
                <th style={{ ...thStyle, width: "140px", textAlign: "center" }}>서명 일시</th>
                <th style={{ ...thStyle }}>전자서명</th>
              </tr>
            </thead>
            <tbody>
              {workerList.map((w, idx) => (
                <tr key={w.id}>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: "500" }}>{w.worker_name}</td>
                  <td style={tdStyle}>{w.company_name ?? "-"}</td>
                  <td style={{
                    ...tdStyle, textAlign: "center", fontWeight: "bold",
                    color: w.signed_at ? "#166534" : "#92400e", fontSize: "10px",
                  }}>
                    {w.signed_at ? "서명완료" : "대기"}
                  </td>
                  <td style={{ ...tdStyle, fontSize: "10px", textAlign: "center" }}>
                    {w.signed_at ? new Date(w.signed_at).toLocaleString("ko-KR") : "-"}
                  </td>
                  <td style={{ ...tdStyle, height: "56px", textAlign: "center", padding: "4px" }}>
                    {w.signature_data ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={w.signature_data}
                        alt={`${w.worker_name} 서명`}
                        style={{ maxHeight: "48px", maxWidth: "200px", margin: "0 auto", display: "block" }}
                      />
                    ) : (
                      <span style={{ color: "#d1d5db" }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "10px", color: "#9ca3af", borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
            <span>주식회사 원엔지니어링</span>
            <span>
              서명 완료 {workerList.filter(w => w.signed_at).length}명 / 전체 {workerList.length}명 · 출력일시: {new Date().toLocaleString("ko-KR")}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
