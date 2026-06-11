interface Props {
  title: string;
  subtitle?: string;
  docNumber?: string;
}

export default function PrintDocumentHeader({ title, subtitle, docNumber }: Props) {
  return (
    <div style={{ textAlign: "center", borderBottom: "2.5px solid #111", paddingBottom: "16px", marginBottom: "20px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo/one-engineering-logo.png"
        alt="주식회사 원엔지니어링"
        style={{ height: "44px", objectFit: "contain", display: "block", margin: "0 auto 6px" }}
      />
      <p style={{ fontSize: "12px", color: "#555", marginBottom: "4px", letterSpacing: "1px" }}>
        주식회사 원엔지니어링
      </p>
      <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>{title}</h1>
      {subtitle && (
        <p style={{ fontSize: "13px", color: "#444", margin: "0 0 4px", fontWeight: "600" }}>{subtitle}</p>
      )}
      {docNumber && (
        <p style={{ fontSize: "11px", color: "#777", margin: 0 }}>{docNumber}</p>
      )}
    </div>
  );
}
