const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const pdfDir = path.join(__dirname, '../pdfs');
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

exports.generateResultPDF = (result, student) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const filename = `result_${result._id}.pdf`;
      const filepath = path.join(pdfDir, filename);
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).text('PSTU Result Sheet', { align: 'center' });
      doc.fontSize(12).text(`\nStudent: ${student.name}`, { align: 'left' });
      doc.text(`Email: ${student.email}`);
      doc.text(`Semester: ${result.semester}`);
      doc.text(`SGPA: ${result.sgpa.toFixed(2)}`);
      doc.text(`CGPA: ${result.cgpa.toFixed(2)}\n`);

      // Course details
      doc.fontSize(12).text('Courses:', { underline: true });
      result.courses.forEach((course, idx) => {
        doc.text(`${idx + 1}. ${course.course.title} - GPA: ${course.gpa.toFixed(2)} (${course.gradePoint})`);
      });

      doc.text(`\nGenerated: ${new Date().toLocaleDateString()}`);
      doc.end();

      stream.on('finish', () => resolve(filepath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};