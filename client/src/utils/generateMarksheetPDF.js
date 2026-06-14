import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates and downloads a professional marksheet PDF.
 * @param {Object} data — response from GET /teacher/marksheet/:studentId/semester/:semester
 */
export function generateMarksheetPDF(data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(14, 116, 144); // teal-600
  doc.rect(0, 0, PW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Patuakhali Science and Technology University', PW / 2, 11, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Semester Marksheet', PW / 2, 18, { align: 'center' });

  doc.setFontSize(8.5);
  doc.text(`Generated: ${new Date().toLocaleString('en-BD')}`, PW / 2, 24, { align: 'center' });

  // ── Student Info ─────────────────────────────────────────────────────────────
  doc.setTextColor(30, 41, 59);
  let y = 36;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, y, PW - 20, 30, 2, 2, 'F');

  const student = data.student || {};
  const infoRows = [
    ['Student Name',    student.name || '—',               'Semester',          String(data.semester || '—')],
    ['Registration No', student.registrationNumber || '—', 'Student ID',        student.studentId || '—'],
    ['Faculty',         student.faculty || '—',            'Email',             student.email || '—'],
  ];

  doc.setFontSize(8.5);
  infoRows.forEach((row, i) => {
    const ry = y + 6 + i * 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(row[0] + ':', 15, ry);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(row[1], 50, ry);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(row[2] + ':', PW / 2 + 5, ry);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(row[3], PW / 2 + 38, ry);
  });

  y += 36;

  // ── Course Marks Table ───────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Course Marks', 10, y + 4);
  y += 9;

  const courses = data.courses || [];
  const tableBody = courses.map((c, i) => [
    i + 1,
    c.code || '—',
    c.title || '—',
    c.credits || c.creditHours || '—',
    `${c.obtainedMarks ?? '—'} / ${c.totalMarks ?? '—'}`,
    c.percentage != null ? `${Number(c.percentage).toFixed(2)}%` : '—',
    c.grade || '—',
    c.gpa != null ? Number(c.gpa).toFixed(2) : '—',
  ]);

  doc.autoTable({
    startY: y,
    head: [['#', 'Code', 'Course Title', 'Cr', 'Marks', '%', 'Grade', 'GPA']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [14, 116, 144], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 18 },
      2: { cellWidth: 60 },
      3: { halign: 'center', cellWidth: 10 },
      4: { halign: 'center', cellWidth: 24 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 14 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ── Summary ──────────────────────────────────────────────────────────────────
  const stats = data.statistics || {};
  doc.setFillColor(240, 253, 244); // green-50
  doc.roundedRect(10, y, PW - 20, 24, 2, 2, 'F');
  doc.setDrawColor(134, 239, 172);
  doc.roundedRect(10, y, PW - 20, 24, 2, 2, 'D');

  const summaryItems = [
    ['Total Courses', String(stats.totalCourses ?? courses.length)],
    ['Total Credits',  String(stats.totalCredits ?? '—')],
    ['Percentage',     stats.percentage ? `${stats.percentage}%` : '—'],
    ['SGPA',           String(stats.sgpa ?? '—')],
  ];

  doc.setFontSize(8.5);
  const colW = (PW - 20) / summaryItems.length;
  summaryItems.forEach(([label, val], i) => {
    const cx = 10 + colW * i + colW / 2;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, cx, y + 9, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61); // green-700
    doc.setFontSize(11);
    doc.text(val, cx, y + 18, { align: 'center' });
    doc.setFontSize(8.5);
  });

  y += 30;

  // ── GPA Scale ────────────────────────────────────────────────────────────────
  if (y < 240) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('GPA Scale Reference', 10, y);
    y += 4;

    const scale = [
      ['A+ (4.00)', '80-100%'], ['A (3.75)', '75-79%'], ['A- (3.50)', '70-74%'],
      ['B+ (3.25)', '65-69%'],  ['B (3.00)',  '60-64%'], ['B- (2.75)', '55-59%'],
      ['C+ (2.50)', '50-54%'],  ['C (2.25)',  '45-49%'], ['D (2.00)',  '40-44%'],
      ['F (0.00)',  '0-39%'],
    ];

    const sColW = (PW - 20) / 5;
    scale.forEach(([g, r], i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const sx = 10 + col * sColW;
      const sy = y + 5 + row * 6;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(g, sx, sy);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(r, sx + 16, sy);
    });
    y += 20;
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(203, 213, 225);
  doc.line(10, footerY - 3, PW - 10, footerY - 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Controller of Examinations — Patuakhali Science and Technology University', 10, footerY + 2);
  doc.text('This is a computer-generated document.', PW - 10, footerY + 2, { align: 'right' });

  // ── Signature placeholder ────────────────────────────────────────────────────
  doc.setDrawColor(203, 213, 225);
  doc.line(PW - 60, footerY - 10, PW - 10, footerY - 10);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Authorized Signature', PW - 35, footerY - 6, { align: 'center' });

  const filename = `Marksheet_${student.registrationNumber || student._id}_Sem${data.semester}.pdf`;
  doc.save(filename);
}
