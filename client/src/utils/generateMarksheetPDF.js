import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const C = {
  navy:  [10,  60, 120],
  black: [20,  20,  20],
  gray:  [100, 100, 100],
  lgray: [160, 160, 160],
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

export async function generateMarksheetPDF(data) {
  const logoData = await loadLogo();

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297, ML = 14, MR = 14;
  const CW = PW - ML - MR; // 182 mm

  const student = data?.student   || {};
  const courses = Array.isArray(data?.courses) ? data.courses : [];
  const stats   = data?.statistics || {};
  const sem     = data?.semester   ?? '—';
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const seq     = String(Math.floor(Math.random() * 8999) + 1000);
  const docNo   = `PSTU/EXAM/SEM-${sem}/${now.getFullYear()}/${seq}`;

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
  doc.text('www.pstu.ac.bd  ·  exam@pstu.ac.bd  ·  +880-0400-0000', PW / 2, 28, { align: 'center' });

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
  doc.text('SEMESTER RESULT SHEET  (PROVISIONAL)', PW / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray);
  doc.text(
    'Issued under the authority of the Controller of Examinations, PSTU',
    PW / 2, y, { align: 'center' }
  );

  y += 4;
  doc.setDrawColor(...C.navy);
  doc.setLineWidth(0.8);
  doc.line(ML, y, ML + CW, y);
  doc.setLineWidth(0.2);
  doc.line(ML, y + 1.5, ML + CW, y + 1.5);

  // ── Ref no & date ────────────────────────────────────────────────────────
  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.black);
  doc.text(`Ref. No: ${docNo}`, ML, y);
  doc.text(`Date of Issue: ${dateStr}`, ML + CW, y, { align: 'right' });

  // ── Student info box ─────────────────────────────────────────────────────
  y += 5;
  const BOX_H = 34;
  doc.setDrawColor(...C.navy);
  doc.setLineWidth(0.5);
  doc.rect(ML, y, CW, BOX_H);
  doc.setLineWidth(0.25);
  doc.line(ML + CW / 2, y, ML + CW / 2, y + BOX_H);

  // Sub-header strips
  doc.setFillColor(...C.bg);
  doc.rect(ML,            y, CW / 2, 6.5, 'F');
  doc.rect(ML + CW / 2,  y, CW / 2, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.navy);
  doc.text('STUDENT INFORMATION',   ML + CW / 4,     y + 4.3, { align: 'center' });
  doc.text('EXAMINATION DETAILS',   ML + CW * 3 / 4, y + 4.3, { align: 'center' });

  const LEFT = [
    ['Student Name',     safe(student.name)],
    ['Registration No.', safe(student.registrationNumber)],
    ['Student ID',       safe(student.studentId)],
    ['Email Address',    safe(student.email)],
  ];
  const RIGHT = [
    ['Semester',        `${ordinal(sem)} Semester`],
    ['Faculty / Dept.', safe(student.faculty)],
    ['Exam. Year',      String(now.getFullYear())],
    ['Result Status',   courses.length > 0 ? 'Result Published' : 'Not Available'],
  ];

  doc.setFontSize(8);
  LEFT.forEach(([label, val], i) => {
    const ry = y + 9 + i * 6;
    doc.setFont('helvetica', 'bold');   doc.setTextColor(...C.gray);
    doc.text(label + ' :', ML + 3, ry);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.black);
    doc.text(val, ML + 44, ry);
  });
  RIGHT.forEach(([label, val], i) => {
    const ry = y + 9 + i * 6;
    const rx = ML + CW / 2 + 3;
    doc.setFont('helvetica', 'bold');   doc.setTextColor(...C.gray);
    doc.text(label + ' :', rx, ry);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.black);
    doc.text(val, rx + 40, ry);
  });

  // ── Course table ─────────────────────────────────────────────────────────
  y += BOX_H + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.navy);
  doc.text(`ACADEMIC PERFORMANCE — ${ordinal(sem).toUpperCase()} SEMESTER`, ML, y);
  y += 4;

  const rows = courses.length
    ? courses.map((c, i) => [
        i + 1,
        safe(c.code),
        safe(c.title),
        safe(c.credits ?? c.creditHours),
        safe(c.totalMarks, '100'),
        safe(c.obtainedMarks),
        c.percentage != null ? Number(c.percentage).toFixed(1) : '—',
        safe(c.grade),
        c.gpa != null ? Number(c.gpa).toFixed(2) : '—',
      ])
    : [['', '', 'No grade records available for this semester.', '', '', '', '', '', '']];

  autoTable(doc, {
    startY: y,
    head: [[
      { content: 'SL.',          styles: { halign: 'center', cellWidth: 8 } },
      { content: 'Course\nCode', styles: { halign: 'center', cellWidth: 22 } },
      { content: 'Course Title', styles: { halign: 'left',   cellWidth: 62 } },
      { content: 'Cr.\nHr.',    styles: { halign: 'center', cellWidth: 11 } },
      { content: 'Full\nMarks', styles: { halign: 'center', cellWidth: 16 } },
      { content: 'Marks\nObtd.',styles: { halign: 'center', cellWidth: 16 } },
      { content: '%',            styles: { halign: 'center', cellWidth: 13 } },
      { content: 'Grade',        styles: { halign: 'center', cellWidth: 14 } },
      { content: 'Grade\nPoint', styles: { halign: 'center', cellWidth: 20 } },
    ]],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
      textColor: C.black,
      lineColor: [190, 190, 190],
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor:   C.navy,
      textColor:   C.white,
      fontStyle:   'bold',
      fontSize:    7.5,
      halign:      'center',
      valign:      'middle',
      cellPadding: 2.5,
      minCellHeight: 11,
    },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'center', fontStyle: 'bold' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center', fontStyle: 'bold' },
      8: { halign: 'center' },
    },
    alternateRowStyles: { fillColor: C.bg },
    tableLineColor: C.navy,
    tableLineWidth: 0.45,
    margin: { left: ML, right: MR },
  });

  y = doc.lastAutoTable.finalY + 5;

  // ── Result summary bar ───────────────────────────────────────────────────
  doc.setFillColor(...C.navy);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.white);
  doc.text('RESULT SUMMARY', PW / 2, y + 4.7, { align: 'center' });

  y += 7;
  const summaryItems = [
    ['Total Courses',    safe(stats.totalCourses, String(courses.length))],
    ['Credit Hours',     safe(stats.totalCredits)],
    ['Marks Obtained',   stats.totalMarks
                           ? `${safe(stats.obtainedMarks)} / ${safe(stats.totalMarks)}`
                           : '—'],
    ['Percentage',       stats.percentage != null
                           ? `${Number(stats.percentage).toFixed(2)}%`
                           : '—'],
    ['SGPA',             safe(stats.sgpa)],
  ];
  const SC = CW / summaryItems.length;
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.3);
  doc.rect(ML, y, CW, 15);

  summaryItems.forEach(([lbl, val], i) => {
    const sx = ML + SC * i;
    if (i > 0) doc.line(sx, y, sx, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.gray);
    doc.text(lbl, sx + SC / 2, y + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...C.navy);
    doc.text(String(val), sx + SC / 2, y + 12, { align: 'center' });
  });

  y += 21;

  // ── Grading scale + notes ────────────────────────────────────────────────
  if (y + 46 < PH - 45) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.navy);
    doc.text('GRADING SCALE (PSTU)', ML, y);

    autoTable(doc, {
      startY: y + 3,
      head: [['Grade', 'Grade Point', 'Marks (%)']],
      body: [
        ['A+', '4.00', '80–100'], ['A',  '3.75', '75–79'], ['A-', '3.50', '70–74'],
        ['B+', '3.25', '65–69'],  ['B',  '3.00', '60–64'], ['B-', '2.75', '55–59'],
        ['C+', '2.50', '50–54'],  ['C',  '2.25', '45–49'], ['D',  '2.00', '40–44'],
        ['F',  '0.00', '0–39'],
      ],
      theme: 'grid',
      styles: {
        fontSize: 7, cellPadding: 1.5, halign: 'center',
        textColor: C.black, lineColor: [210, 210, 210], lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [60, 60, 80], textColor: C.white,
        fontStyle: 'bold', fontSize: 7.5, halign: 'center',
      },
      tableWidth: 62,
      margin: { left: ML },
    });

    // Notes beside the scale table
    const nx = ML + 68;
    let ny = y + 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.navy);
    doc.text('Important Notes:', nx, ny);
    const notes = [
      '1. This is a provisional semester result sheet.',
      '2. Official academic transcript is issued separately',
      '   by the Controller of Examinations, PSTU.',
      '3. Minimum CGPA for graduation: 2.00',
      '4. Grade "F" denotes course failure (re-sit required).',
      '5. Discrepancy queries: exam@pstu.ac.bd',
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.gray);
    notes.forEach((note, i) => doc.text(note, nx, ny + 7 + i * 5));

    y = Math.max(doc.lastAutoTable.finalY, y + 46) + 6;
  }

  // ── Signature block ──────────────────────────────────────────────────────
  const sigY = Math.max(y, PH - 50);
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.4);

  doc.line(ML, sigY, ML + 62, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.black);
  doc.text('Head of Department', ML, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray);
  doc.text(safe(student.faculty, 'Department'), ML, sigY + 10);
  doc.text('Patuakhali Science and Technology University', ML, sigY + 14.5);

  const rsigX = ML + CW - 65;
  doc.line(rsigX, sigY, ML + CW, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...C.black);
  doc.text('Controller of Examinations', rsigX, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.gray);
  doc.text('Examination Division', rsigX, sigY + 10);
  doc.text('Patuakhali Science and Technology University', rsigX, sigY + 14.5);

  // ── Footer ───────────────────────────────────────────────────────────────
  const ftY = PH - 16;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(ML, ftY, ML + CW, ftY);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(...C.lgray);
  doc.text(
    'This document is generated electronically. Unauthorized alteration is a punishable offence under the laws of Bangladesh.',
    PW / 2, ftY + 4.5, { align: 'center' }
  );
  doc.text(
    `Ref: ${docNo}  ·  Generated: ${now.toLocaleString('en-BD')}  ·  PSTU Campus Portal`,
    PW / 2, ftY + 9, { align: 'center' }
  );

  const reg = safe(student.registrationNumber || student.studentId, 'NA').replace(/[/\\:*?<>|]/g, '-');
  doc.save(`PSTU_Result_${reg}_Sem${sem}.pdf`);
}
