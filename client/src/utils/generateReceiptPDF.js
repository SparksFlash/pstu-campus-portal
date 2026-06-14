import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateReceiptPDF(payment) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // ── Header ────────────────────────────────────────────────────────────
  doc.setFillColor(30, 64, 175); // primary blue
  doc.rect(0, 0, W, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Patuakhali Science and Technology University', W / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Dumki, Patuakhali-8602, Bangladesh', W / 2, 21, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PAYMENT RECEIPT', W / 2, 31, { align: 'center' });

  // ── Receipt Status Banner ─────────────────────────────────────────────
  const statusColor = payment.status === 'completed' ? [22, 163, 74] : [220, 38, 38];
  doc.setFillColor(...statusColor);
  doc.rect(0, 38, W, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    payment.status === 'completed' ? 'PAYMENT SUCCESSFUL' : payment.status.toUpperCase(),
    W / 2, 43.5, { align: 'center' }
  );

  // ── Transaction Details ───────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  let y = 56;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', 14, y);
  y += 7;

  const details = [
    ['Transaction ID',     payment.tranId],
    ['Validation ID',      payment.valId || 'N/A'],
    ['Bank Transaction',   payment.bankTranId || 'N/A'],
    ['Date & Time',        payment.paidAt
                             ? new Date(payment.paidAt).toLocaleString('en-BD')
                             : new Date(payment.createdAt).toLocaleString('en-BD')],
    ['Status',             payment.status.charAt(0).toUpperCase() + payment.status.slice(1)],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: details,
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: [80, 80, 80] },
      1: { cellWidth: 120 },
    },
    margin: { left: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Student Information ───────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Student Information', 14, y);
  y += 7;

  const studentName  = payment.student?.name  || 'N/A';
  const studentEmail = payment.student?.email || 'N/A';
  const regNo        = payment.student?.registrationNumber || 'N/A';
  const studId       = payment.student?.studentId || 'N/A';

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ['Name',                studentName],
      ['Email',               studentEmail],
      ['Registration No.',    regNo],
      ['Student ID',          studId],
      ['Faculty',             payment.faculty?.name || 'N/A'],
    ],
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: [80, 80, 80] },
      1: { cellWidth: 120 },
    },
    margin: { left: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Payment Summary ───────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Payment Summary', 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [['Purpose', 'Semester', 'Academic Year', 'Amount']],
    body: [[
      'Semester Enrollment Fee',
      `Semester ${payment.semester}`,
      payment.academicYear || 'N/A',
      `BDT ${payment.amount?.toLocaleString() || '0'}`,
    ]],
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Total ─────────────────────────────────────────────────────────────
  doc.setFillColor(240, 245, 255);
  doc.rect(110, y - 2, 85, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.text('Total Amount:', 114, y + 6);
  doc.text(`BDT ${payment.amount?.toLocaleString() || '0'}`, W - 16, y + 6, { align: 'right' });

  // ── Footer ────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 28;

  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY, W - 14, footerY);

  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('This is a computer-generated receipt and does not require a physical signature.', W / 2, footerY + 6, { align: 'center' });
  doc.text('For queries, contact: accounts@pstu.ac.bd | Phone: +880-0400-0000', W / 2, footerY + 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-BD')}`, W / 2, footerY + 17, { align: 'center' });
  doc.text('Patuakhali Science and Technology University — Official Payment Receipt', W / 2, footerY + 23, { align: 'center' });

  doc.save(`PSTU-Receipt-${payment.tranId}.pdf`);
}
