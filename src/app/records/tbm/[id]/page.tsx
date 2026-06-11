export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintStyles from "@/components/print/PrintStyles";
import PrintDocumentHeader from "@/components/print/PrintDocumentHeader";
import PrintDocumentFooter from "@/components/print/PrintDocumentFooter";
import PrintButtonBar from "@/components/print/PrintButtonBar";
import { thStyle, tdStyle, sectionTitleStyle } from "@/components/print/printStyleConstants";
import type { TbmRecord, TbmAttendee, TbmApproval } from "@/types";

export default async function TbmPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: record } = await supabase
    .from("tbm_records")
    .select("*")
    .eq("id", id)
    .eq("admin_id", user!.id)
    .single();

  if (!record) notFound();

  const [{ data: attendees }, { data: approvalsData }] = await Promise.all([
    supabase.from("tbm_attendees").select("*").eq("tbm_record_id", id).order("created_at"),
    supabase.from("tbm_approvals").select("*").eq("tbm_record_id", id).order("created_at"),
  ]);

  const tbm = record as TbmRecord;
  const att = (attendees ?? []) as TbmAttendee[];
  const approvals = (approvalsData ?? []) as TbmApproval[];
  const safetyApproval = approvals.find((a) => a.approver_role === "안전전담자");
  const repApproval = approvals.find((a) => a.approver_role === "소장대표");

  return (
    <>
      <PrintStyles />
      <PrintButtonBar
        backHref="/records"
        backLabel="← 통합 기록 보관함"
        pageTitle="TBM 기록 출력"
        hasAppendix={att.length > 0}
      />

      {/* ── 본문 섹션 (A4 세로) ── */}
      <div className="print-body-section mx-auto bg-white px-10 py-8 print:px-0 print:py-0" style={{ maxWidth: "210mm" }}>
        <PrintDocumentHeader
          title="위험성평가 일일교육 (TBM) 실시 기록"
          docNumber={`TBM-${tbm.date} · 출력일: ${new Date().toLocaleDateString("ko-KR")}`}
        />

        {/* 기본 정보 */}
        <section style={{ marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>기본 정보</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <tbody>
              <tr>
                <th style={thStyle}>작성일</th>
                <td style={tdStyle}>{tbm.date}</td>
                <th style={thStyle}>협력사명</th>
                <td style={tdStyle}>{tbm.company ?? "-"}</td>
              </tr>
              <tr>
                <th style={thStyle}>작업장 위치</th>
                <td style={tdStyle}>{tbm.worksite_location ?? "-"}</td>
                <th style={thStyle}>공종</th>
                <td style={tdStyle}>{tbm.work_type}</td>
              </tr>
              <tr>
                <th style={thStyle}>세부 공정명</th>
                <td style={tdStyle}>{tbm.process_name ?? "-"}</td>
                <th style={thStyle}>실시자</th>
                <td style={tdStyle}>{tbm.supervisor ?? "-"}</td>
              </tr>
              <tr>
                <th style={thStyle}>안전전담자</th>
                <td style={tdStyle}>{tbm.safety_manager ?? "-"}</td>
                <th style={thStyle}>소장/대표</th>
                <td style={tdStyle}>{tbm.site_manager ?? "-"}</td>
              </tr>
              <tr>
                <th style={thStyle}>교육 실시</th>
                <td style={tdStyle}>{tbm.education_done ? "실시 완료" : "미실시"}</td>
                <th style={thStyle}>상태</th>
                <td style={tdStyle}>{tbm.status}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 위험요인 */}
        {tbm.hazard_items && tbm.hazard_items.length > 0 && (
          <section style={{ marginBottom: "20px" }}>
            <h2 style={sectionTitleStyle}>위험요인 및 안전대책</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ ...thStyle, width: "32px", textAlign: "center" }}>번호</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>위험요인 및 안전대책</th>
                </tr>
              </thead>
              <tbody>
                {tbm.hazard_items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, textAlign: "center", color: "#6b7280" }}>{i + 1}</td>
                    <td style={tdStyle}>{item}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 특이사항 */}
        {(tbm.main_hazard_notes || tbm.accident_case_notes) && (
          <section style={{ marginBottom: "20px" }}>
            <h2 style={sectionTitleStyle}>당일 특이사항</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <tbody>
                {tbm.main_hazard_notes && (
                  <tr>
                    <th style={{ ...thStyle, width: "130px", verticalAlign: "top" }}>당일 주요 유해위험</th>
                    <td style={{ ...tdStyle, whiteSpace: "pre-wrap" }}>{tbm.main_hazard_notes}</td>
                  </tr>
                )}
                {tbm.accident_case_notes && (
                  <tr>
                    <th style={{ ...thStyle, verticalAlign: "top" }}>사고사례 전파</th>
                    <td style={{ ...tdStyle, whiteSpace: "pre-wrap" }}>{tbm.accident_case_notes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* 확인란 */}
        <section style={{ marginTop: "24px", borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
          <h2 style={sectionTitleStyle}>확인란</h2>
          {approvals.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", textAlign: "center" }}>
              <ApprovalCell label="TBM 실시·확인자" approval={safetyApproval} />
              {tbm.require_representative_approval ? (
                <ApprovalCell label="소장 / 대표" approval={repApproval} />
              ) : (
                <div>
                  <p style={{ fontWeight: "600", color: "#374151", marginBottom: "8px", fontSize: "13px" }}>소장 / 대표</p>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "4px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "11px", color: "#d1d5db" }}>해당 없음</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", textAlign: "center" }}>
              {["작 성 자", "안전전담자", "소장 / 대표"].map((label) => (
                <div key={label}>
                  <p style={{ fontWeight: "600", color: "#374151", marginBottom: "32px", fontSize: "13px" }}>{label}</p>
                  <div style={{ borderBottom: "1px solid #9ca3af", height: "48px" }} />
                  <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>(서명 또는 날인)</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <PrintDocumentFooter />
      </div>

      {/* ── 서명 부록 (A4 가로, 참석자) ── */}
      {att.length > 0 && (
        <div className="print-appendix-section mx-auto bg-white px-10 py-8 print:px-0 print:py-0 mt-8" style={{ maxWidth: "270mm" }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "12px", marginBottom: "16px" }}>
            <p style={{ fontSize: "11px", color: "#555", letterSpacing: "1px", marginBottom: "4px" }}>
              주식회사 원엔지니어링 — TBM-{tbm.date}
            </p>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "4px 0" }}>별첨 1 · 참석자 서명부</h2>
            <p style={{ fontSize: "11px", color: "#777", margin: 0 }}>Attendance Signature Appendix</p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ ...thStyle, width: "32px", textAlign: "center" }}>No</th>
                <th style={{ ...thStyle, width: "90px" }}>성명</th>
                <th style={{ ...thStyle, width: "70px", textAlign: "center" }}>상태</th>
                <th style={{ ...thStyle }}>전자서명</th>
                <th style={{ ...thStyle, width: "150px", textAlign: "center" }}>서명일시</th>
              </tr>
            </thead>
            <tbody>
              {att.map((a, i) => (
                <tr key={a.id}>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: "500" }}>{a.employee_name}</td>
                  <td style={{ ...tdStyle, textAlign: "center", fontSize: "10px" }}>{a.attendance_status}</td>
                  <td style={{ ...tdStyle, height: "56px", textAlign: "center", padding: "4px" }}>
                    {a.signature_data ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.signature_data}
                        alt="서명"
                        style={{ maxHeight: "48px", maxWidth: "200px", margin: "0 auto", display: "block" }}
                      />
                    ) : (
                      <span style={{ color: "#d1d5db" }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center", fontSize: "10px", color: "#6b7280" }}>
                    {a.signed_at ? new Date(a.signed_at).toLocaleString("ko-KR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "10px", color: "#9ca3af", borderTop: "1px solid #e5e7eb", paddingTop: "8px" }}>
            <span>주식회사 원엔지니어링</span>
            <span>
              서명 완료 {att.filter(a => a.attendance_status === "서명완료").length}명 / 전체 {att.length}명 · 출력일시: {new Date().toLocaleString("ko-KR")}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

function ApprovalCell({
  label,
  approval,
}: {
  label: string;
  approval: TbmApproval | undefined;
}) {
  const approved = approval?.approval_status === "승인";
  return (
    <div>
      <p style={{ fontWeight: "600", color: "#374151", marginBottom: "8px", fontSize: "13px" }}>{label}</p>
      <div style={{ border: "1px solid #d1d5db", borderRadius: "4px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        {approved && approval?.signature_data ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={approval.signature_data}
            alt={`${label} 전자서명`}
            style={{ maxHeight: "64px", objectFit: "contain" }}
          />
        ) : (
          <span style={{ fontSize: "11px", color: "#d1d5db" }}>(전자확인 대기)</span>
        )}
      </div>
      <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
        {approval?.approver_name ?? "-"}
        {approved && approval?.approved_at
          ? ` · ${new Date(approval.approved_at).toLocaleDateString("ko-KR")}`
          : ""}
      </p>
    </div>
  );
}
