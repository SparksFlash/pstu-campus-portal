import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const C = {
  navy:  [10,  60, 120],
  green: [22, 101,  52],
  red:   [185,  28,  28],
  black: [20,  20,  20],
  gray:  [100, 100, 100],
  lgray: [160, 160, 160],
  gbg:   [240, 253, 244],
  bg:    [248, 249, 252],
  white: [255, 255, 255],
};

async function loadLogo() {
  try {
    const res  = await fetch('/assets/logos/logo.png');
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader     = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror   = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function safe(v, fb = '—') {
  return (v === null || v === undefined || String(v).trim() === '') ? fb : String(v);
}

function ordinal(n) {
  const x = parseInt(n, 10);
  if (!x) return safe(n);
  const s = ['th', 'st', 'nd', 'rd'];
  const v = x % 100;
  return `${x}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function takaInWords(amount) {
  const n = parseInt(amount, 10);
  if (!n || isNaN(n)) return 'Amount Not Specified';
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function convert(num) {
    if (num === 0)      return '';
    if (num < 20)       return ones[num];
    if (num < 100)      return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000)     return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 100000)   return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    return               convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
  }
  return convert(n).trim() + ' Taka Only';
}

export async function generateReceiptPDF(payment) {
  const logoData = await loadLogo();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297, ML = 14, MR = 14;
  const CW = PW - ML - MR;

  const p       = payment  || {};
  const student = p.student || {};
  const faculty = p.faculty  || {};
  const now     = new Date();
  const paidAt  = p.paidAt || p.createdAt ? new Date(p.paidAt || p.createdAt) : now;
  const dateStr = paidAt.toLocaleDateString('en-GB',  { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = paidAt.toLocaleTimeString('en-BD',  { hour: '2-digit', minute: '2-digit' });
  const isOK    = p.status === 'completed';
  const rcptNo  = `PSTU-RCP-${safe(p.tranId, String(Date.now())).slice(-8).toUpperCase()}`;

  // ── Page border ──────────────────────────────────────────────────────────
  doc.setDrawColor(...C.navy);
  doc.setLineWidth(1.0);
  doc.rect(7, 7, PW - 14, PH - 14);
  doc.setLineWidth(0.25);
  doc.rect(9, 9, PW - 18, PH - 18);

  // ── Logo ─────────────────────────────────────────────────────────────────
  if (logoData) {
    doc.addImage(logoData, 'PNG', ML, 13, 22, 20);
  }

  // ── University header ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(...C.navy);
  doc.text('PATUAKHALI SCIENCE AND TECHNOLOGY UNIVERSITY', PW / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.gray);
  doc.text('Dumki, Patuakhali-8602, Bangladesh', PW / 2, 23.5, { align: 'center' });
  doc.text('Accounts Section  ·  accounts@pstu.ac.bd  ·  +880-0400-0000', PW / 2, 28, { align: 'center' });

  // ── Title block ──────────────────────────────────────────────────────────
  let y = 34;
  doc.setDrawColor(...C.navy);
  doc.setLineWidth(0.8);
  doc.line(ML, y, ML + CW, y);
  doc.setLineWidth(0.2);
  doc.line(ML, y + 1.5, ML + CW, y + 1.5);

  y += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...C.navy);
  doc.text('MONEY RECEIPT  /  FEE CHALLAN', PW / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray);
  doc.text(
    'Office of the Controller of Finance, Patuakhali Science and Technology University',
    PW / 2, y, { align: 'center' }
  );

  y += 4;
  doc.setDrawColor(...C.navy);
  doc.setLineWidth(0.8);
  doc.line(ML, y, ML + CW, y);
  doc.setLineWidth(0.2);
  doc.line(ML, y + 1.5, ML + CW, y + 1.5);

  // ── Receipt no & date ────────────────────────────────────────────────────
  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.black);
  doc.text(`Receipt No: ${rcptNo}`, ML, y);
  doc.text(`Date: ${dateStr}  ${timeStr}`, ML + CW, y, { align: 'right' });

  // ── Status banner ────────────────────────────────────────────────────────
  y += 5;
  const sc = isOK ? C.green : C.red;
  const st = isOK ? '✓   PAYMENT RECEIVED — AMOUNT CREDITED SUCCESSFULLY' : `✗   ${safe(p.status, 'UNKNOWN').toUpperCase()}`;
  doc.setFillColor(...sc);
  doc.roundedRect(ML, y, CW, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...C.white);
  doc.text(st, PW / 2, y + 5.8, { align: 'center' });

  // ── Two-column info box ──────────────────────────────────────────────────
  y += 15;
  const BOX_H = 42;
  doc.setDrawColor(...C.navy);
  doc.setLineWidth(0.5);
  doc.rect(ML, y, CW, BOX_H);
  doc.setLineWidth(0.25);
  doc.line(ML + CW / 2, y, ML + CW / 2, y + BOX_H);

  // Column headers
  doc.setFillColor(...C.bg);
  doc.rect(ML,           y, CW / 2, 7, 'F');
  doc.rect(ML + CW / 2,  y, CW / 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.navy);
  doc.text('STUDENT INFORMATION',  ML + CW / 4,     y + 4.5, { align: 'center' });
  doc.text('TRANSACTION DETAILS',  ML + CW * 3 / 4, y + 4.5, { align: 'center' });

  const leftInfo = [
    ['Name',             safe(student.name)],
    ['Registration No.', safe(student.registrationNumber)],
    ['Student ID',       safe(student.studentId)],
    ['Department',       safe(faculty.name || student.faculty)],
    ['Email',            safe(student.email)],
  ];
  const rightInfo = [
    ['Semester',         `${ordinal(safe(p.semester, '—'))} Semester`],
    ['Academic Year',    safe(p.academicYear)],
    ['Transaction ID',   safe(p.tranId)],
    ['Validation ID',    safe(p.valId)],
    ['Bank Tran. ID',    safe(p.bankTranId)],
  ];

  doc.setFontSize(7.8);
  leftInfo.forEach(([label, val], i) => {
    const ry = y + 10 + i * 5.8;
    doc.setFont('helvetica', 'bold');   doc.setTextColor(...C.gray);
    doc.text(label + ' :', ML + 3, ry);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.black);
    const display = val.length > 28 ? val.slice(0, 26) + '…' : val;
    doc.text(display, ML + 40, ry);
  });
  rightInfo.forEach(([label, val], i) => {
    const ry = y + 10 + i * 5.8;
    const rx = ML + CW / 2 + 3;
    doc.setFont('helvetica', 'bold');   doc.setTextColor(...C.gray);
    doc.text(label + ' :', rx, ry);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.black);
    const display = val.length > 24 ? val.slice(0, 22) + '…' : val;
    doc.text(display, rx + 34, ry);
  });

  // ── Fee breakdown table ──────────────────────────────────────────────────
  y += BOX_H + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.navy);
  doc.text('FEE DETAILS', ML, y);
  y += 4;

  const amount   = Number(p.amount  || 0);
  const semLabel = `${ordinal(safe(p.semester, '—'))} Semester`;

  autoTable(doc, {
    startY: y,
    head: [['SL.', 'Description', 'Semester', 'Academic Year', 'Amount (BDT)']],
    body: [['01', 'Semester Enrollment Fee', semLabel, safe(p.academicYear), amount.toLocaleString('en-BD')]],
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 3.2,
      textColor: C.black,
      lineColor: [190, 190, 190],
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 72 },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 32 },
      4: { halign: 'right',  cellWidth: 38, fontStyle: 'bold' },
    },
    tableLineColor: C.navy,
    tableLineWidth: 0.45,
    margin: { left: ML, right: MR },
  });

  y = doc.lastAutoTable.finalY;

  // Total row
  doc.setFillColor(...C.navy);
  doc.rect(ML, y, CW, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...C.white);
  doc.text('TOTAL AMOUNT PAID', ML + 6, y + 6.5);
  doc.text(`BDT  ${amount.toLocaleString('en-BD')}`, ML + CW - 6, y + 6.5, { align: 'right' });

  y += 15;

  // Amount in words
  doc.setFillColor(...C.gbg);
  doc.setDrawColor(134, 239, 172);
  doc.setLineWidth(0.3);
  doc.rect(ML, y, CW, 10, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.green);
  doc.text('In Words:', ML + 4, y + 6.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.black);
  doc.text(takaInWords(amount), ML + 25, y + 6.2);

  // ── Signature block ──────────────────────────────────────────────────────
  y += 18;
  const sigY = Math.max(y, PH - 68);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...C.gray);
  doc.text('Received with Thanks', PW / 2, sigY, { align: 'center' });

  const lineY = sigY + 16;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.4);

  // Left: Student signature
  doc.line(ML, lineY, ML + 62, lineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.black);
  doc.text('Signature of Student', ML, lineY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray);
  doc.text(safe(student.name, ''), ML, lineY + 10);
  doc.text(safe(student.registrationNumber, ''), ML, lineY + 15);

  // Center: Official seal placeholder
  const sealX = PW / 2, sealY = lineY + 4;
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.5);
  doc.circle(sealX, sealY, 13, 'D');
  doc.circle(sealX, sealY, 11.5, 'D');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(...C.lgray);
  doc.text('PSTU', sealX, sealY - 4.5, { align: 'center' });
  doc.text('OFFICIAL', sealX, sealY - 0.5, { align: 'center' });
  doc.text('SEAL', sealX, sealY + 3.5, { align: 'center' });

  // Right: Accounts office
  const rsigX = ML + CW - 65;
  doc.line(rsigX, lineY, ML + CW, lineY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.black);
  doc.text('Accounts Office', rsigX, lineY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray);
  doc.text('Patuakhali Science and Technology University', rsigX, lineY + 10);
  doc.text('Dumki, Patuakhali-8602', rsigX, lineY + 15);

  // ── Footer ───────────────────────────────────────────────────────────────
  const ftY = PH - 16;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(ML, ftY, ML + CW, ftY);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(...C.lgray);
  doc.text(
    'This is a computer-generated receipt. No physical signature is required for validity.',
    PW / 2, ftY + 4.5, { align: 'center' }
  );
  doc.text(
    `Receipt: ${rcptNo}  ·  Tran. ID: ${safe(p.tranId)}  ·  Generated: ${now.toLocaleString('en-BD')}`,
    PW / 2, ftY + 9, { align: 'center' }
  );

  const filename = `PSTU-Receipt-${safe(p.tranId, 'NA').replace(/[/\\:*?<>|]/g, '-')}.pdf`;
  doc.save(filename);
}
