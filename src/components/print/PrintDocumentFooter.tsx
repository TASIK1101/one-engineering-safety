export default function PrintDocumentFooter() {
  const printDateTime = new Date().toLocaleString("ko-KR");
  return (
    <div style={{
      borderTop: "1px solid #ccc",
      paddingTop: "10px",
      marginTop: "16px",
      display: "flex",
      justifyContent: "space-between",
      fontSize: "11px",
      color: "#777",
    }}>
      <span>주식회사 원엔지니어링</span>
      <span>출력일시: {printDateTime}</span>
    </div>
  );
}
