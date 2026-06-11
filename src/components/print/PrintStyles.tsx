export default function PrintStyles() {
  return (
    <style>{`
      @page { size: A4 portrait; margin: 15mm; }
      @page appendix { size: A4 landscape; margin: 10mm; }
      @media print {
        .no-print { display: none !important; }
        body {
          font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Nanum Gothic', Arial, sans-serif;
          font-size: 11pt;
          color: #000 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * { box-shadow: none !important; }
        a { color: #000; text-decoration: none; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        .print-appendix-section {
          page: appendix;
          break-before: page;
          page-break-before: always;
        }
        body.printing-body .print-appendix-section { display: none !important; }
        body.printing-appendix .print-body-section { display: none !important; }
      }
      body {
        font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Nanum Gothic', Arial, sans-serif;
      }
    `}</style>
  );
}
