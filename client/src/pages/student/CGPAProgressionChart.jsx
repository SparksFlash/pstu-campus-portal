import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Dot,
} from 'recharts';

const GRADE_THRESHOLDS = [
  { value: 3.75, label: 'A (Distinction)', color: '#10b981' },
  { value: 3.00, label: 'B (Good)',         color: '#3b82f6' },
  { value: 2.00, label: 'D (Pass)',          color: '#f59e0b' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">Semester {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{Number(p.value).toFixed(2)}</span>
        </p>
      ))}
    </div>
  );
}

function CustomDot(props) {
  const { value } = props;
  let fill = '#ef4444';
  if (value >= 3.75) fill = '#10b981';
  else if (value >= 3.00) fill = '#3b82f6';
  else if (value >= 2.00) fill = '#f59e0b';
  return <Dot {...props} fill={fill} stroke="#fff" strokeWidth={2} r={5} />;
}

export default function CGPAProgressionChart({ resultsBySemester, cgpa }) {
  const chartData = useMemo(() => {
    if (!resultsBySemester) return [];

    const semesters = Object.keys(resultsBySemester).map(Number).sort((a, b) => a - b);
    let cumulativeGP      = 0;
    let cumulativeCredits = 0;

    return semesters.map((sem) => {
      const semData = resultsBySemester[sem];
      const sgpa    = parseFloat(semData.semesterGPA) || 0;

      // Recalculate cumulative credit-weighted CGPA up to this semester
      cumulativeGP      += semData.totalGradePoints || 0;
      cumulativeCredits += semData.totalCredits     || 0;
      const runningCGPA = cumulativeCredits > 0
        ? parseFloat((cumulativeGP / cumulativeCredits).toFixed(2))
        : 0;

      return {
        semester: sem,
        SGPA:     parseFloat(sgpa.toFixed(2)),
        CGPA:     runningCGPA,
        courses:  semData.grades.length,
        credits:  semData.totalCredits,
      };
    });
  }, [resultsBySemester]);

  if (!chartData.length) return null;

  const latestCGPA = parseFloat(cgpa) || 0;
  let cgpaColor = '#ef4444';
  if (latestCGPA >= 3.75) cgpaColor = '#10b981';
  else if (latestCGPA >= 3.00) cgpaColor = '#3b82f6';
  else if (latestCGPA >= 2.00) cgpaColor = '#f59e0b';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-800">Academic Progression</h2>
          <p className="text-xs text-gray-400 mt-0.5">SGPA per semester and cumulative CGPA trend</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400">Current CGPA</p>
            <p className="text-2xl font-bold" style={{ color: cgpaColor }}>
              {Number(cgpa).toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Semesters</p>
            <p className="text-2xl font-bold text-gray-700">{chartData.length}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-5">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey="semester"
              tickFormatter={(v) => `Sem ${v}`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 4.0]}
              ticks={[0, 1.0, 2.0, 3.0, 3.5, 4.0]}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />

            {GRADE_THRESHOLDS.map((t) => (
              <ReferenceLine
                key={t.value}
                y={t.value}
                stroke={t.color}
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{ value: t.label, position: 'insideTopRight', fontSize: 9, fill: t.color }}
              />
            ))}

            <Line
              type="monotone"
              dataKey="SGPA"
              stroke="#6366f1"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="CGPA"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              strokeDasharray="6 2"
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-semester summary strip */}
      <div className="border-t border-gray-100 grid divide-x divide-gray-100" style={{ gridTemplateColumns: `repeat(${chartData.length}, 1fr)` }}>
        {chartData.map((d) => (
          <div key={d.semester} className="px-3 py-3 text-center">
            <p className="text-xs text-gray-400">Sem {d.semester}</p>
            <p className="font-bold text-gray-800 text-sm">{d.SGPA.toFixed(2)}</p>
            <p className="text-xs text-gray-400">{d.credits} cr</p>
          </div>
        ))}
      </div>
    </div>
  );
}
