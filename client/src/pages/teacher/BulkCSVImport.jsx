import React, { useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import teacherService from '../../services/teacherService';
import { FiUpload, FiFile, FiX, FiCheck, FiAlertCircle, FiDownload } from 'react-icons/fi';
import { semesterLabel } from '../../utils/formatters';

// Simple client-side CSV parser
function parseCSV(text) {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

// Validate a parsed row
function validateRow(row, idx) {
  const errors = [];
  if (!row.registration_number) errors.push('Missing registration_number');
  if (!row.course_code) errors.push('Missing course_code');
  const obtained = parseFloat(row.obtained_marks);
  const total = parseFloat(row.total_marks || '100');
  if (isNaN(obtained) || obtained < 0) errors.push('Invalid obtained_marks');
  if (isNaN(total) || total <= 0) errors.push('Invalid total_marks');
  if (!isNaN(obtained) && !isNaN(total) && obtained > total) errors.push('Obtained > Total');
  return { ...row, _idx: idx + 1, _errors: errors, _valid: errors.length === 0 };
}

const TEMPLATE = `registration_number,course_code,obtained_marks,total_marks
2021CSE001,CSE101,75,100
2021CSE001,CSE102,82,100
2021CSE002,CSE101,68,100`;

export default function BulkCSVImport() {
  const [semester, setSemester] = useState(1);
  const [rows, setRows]         = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult]     = useState(null);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows: parsed } = parseCSV(e.target.result);
      const validated = parsed.map((r, i) => validateRow(r, i));
      setRows(validated);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'text/csv' || file?.name.endsWith('.csv')) handleFile(file);
    else toast.warn('Please drop a .csv file');
  };

  const validRows  = rows.filter((r) => r._valid);
  const invalidRows = rows.filter((r) => !r._valid);

  const handleImport = async () => {
    if (!validRows.length) { toast.warn('No valid rows to import'); return; }
    setImporting(true);
    try {
      const payload = validRows.map((r) => ({
        registrationNumber: r.registration_number,
        courseCode: r.course_code,
        obtainedMarks: parseFloat(r.obtained_marks),
        totalMarks: parseFloat(r.total_marks || '100'),
      }));
      const res = await teacherService.bulkCSVImport(semester, payload);
      setResult(res);
      toast.success(`Imported ${res.saved} grade(s) successfully`);
      if (res.failed > 0) toast.warn(`${res.failed} row(s) failed — see details below`);
    } catch (err) {
      toast.error(err?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'marks_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <FiUpload size={20} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk CSV Import</h1>
              <p className="text-sm text-gray-500">Upload marks for multiple students at once</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Semester:</label>
            <select value={semester} onChange={(e) => setSemester(parseInt(e.target.value))} className="input w-36">
              {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>{semesterLabel(s)}</option>)}
            </select>
          </div>
        </div>

        {/* Template + format info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4 items-start">
          <FiFile size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800 mb-1">Required CSV Format</p>
            <code className="text-xs text-blue-700 block font-mono">
              registration_number, course_code, obtained_marks, total_marks
            </code>
            <p className="text-xs text-blue-600 mt-1">
              <code>total_marks</code> is optional — defaults to 100.
            </p>
          </div>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-blue-700 border border-blue-200 bg-white px-3 py-1.5 rounded-lg hover:bg-blue-50 transition flex-shrink-0">
            <FiDownload size={13} /> Template
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition"
        >
          <FiUpload size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-600">Drag & drop CSV file here, or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">Supports .csv files only</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {/* Preview table */}
        {rows.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-800">Preview</h2>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{rows.length} rows</span>
                {validRows.length > 0 && (
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{validRows.length} valid</span>
                )}
                {invalidRows.length > 0 && (
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{invalidRows.length} invalid</span>
                )}
              </div>
              <button onClick={() => { setRows([]); setResult(null); }} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <FiX size={13} /> Clear
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">#</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Registration No.</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Course Code</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600">Obtained</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600">Total</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r) => (
                    <tr key={r._idx} className={r._valid ? 'hover:bg-gray-50' : 'bg-red-50'}>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{r._idx}</td>
                      <td className="px-4 py-2.5 font-mono text-gray-800">{r.registration_number || '—'}</td>
                      <td className="px-4 py-2.5 font-mono text-primary-600">{r.course_code || '—'}</td>
                      <td className="px-4 py-2.5 text-center">{r.obtained_marks || '—'}</td>
                      <td className="px-4 py-2.5 text-center">{r.total_marks || '100'}</td>
                      <td className="px-4 py-2.5 text-center">
                        {r._valid ? (
                          <FiCheck size={15} className="mx-auto text-green-500" />
                        ) : (
                          <span title={r._errors.join(', ')}>
                            <FiAlertCircle size={15} className="mx-auto text-red-500" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invalidRows.length > 0 && (
              <div className="px-5 py-3 bg-red-50 border-t border-red-100">
                <p className="text-xs font-medium text-red-700">Validation errors (hover the ⚠ icon for details):</p>
                <ul className="mt-1 space-y-0.5">
                  {invalidRows.map((r) => (
                    <li key={r._idx} className="text-xs text-red-600">
                      Row {r._idx}: {r._errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={handleImport}
                disabled={importing || validRows.length === 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <FiUpload size={15} />
                {importing ? 'Importing…' : `Import ${validRows.length} valid row(s) to ${semesterLabel(semester)}`}
              </button>
            </div>
          </div>
        )}

        {/* Import result */}
        {result && (
          <div className={`rounded-xl p-5 border ${result.failed === 0 ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
            <p className={`text-sm font-semibold mb-2 ${result.failed === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
              Import complete — {result.saved} saved, {result.failed} failed
            </p>
            {result.errors?.length > 0 && (
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-yellow-700">
                    {e.registrationNumber} / {e.courseCode}: {e.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
