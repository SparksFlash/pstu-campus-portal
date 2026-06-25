import React, { useState, useEffect } from 'react';
import { FiDownload, FiLoader, FiCheckCircle, FiXCircle, FiClock, FiSlash } from 'react-icons/fi';
import paymentService from '../../services/paymentService';
import { generateReceiptPDF } from '../../utils/generateReceiptPDF';

const STATUS_CONFIG = {
  completed: { label: 'Paid',      icon: FiCheckCircle, cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  pending:   { label: 'Pending',   icon: FiClock,       cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  failed:    { label: 'Failed',    icon: FiXCircle,     cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { label: 'Cancelled', icon: FiSlash,       cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

export default function PaymentHistory() {
  const [payments, setPayments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    paymentService.getMyPayments()
      .then(data => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load payment history.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (payment) => {
    setDownloading(p => ({ ...p, [payment._id]: true }));
    try {
      // Fetch full payment with populated student/faculty
      const full = await paymentService.getPaymentByTranId(payment.tranId);
      await generateReceiptPDF(full);
    } catch {
      alert('Failed to download receipt.');
    } finally {
      setDownloading(p => ({ ...p, [payment._id]: false }));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <FiLoader className="animate-spin text-primary-600" size={28} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All your semester fee payment transactions.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FiClock size={42} className="mx-auto mb-3 opacity-30" />
          <p className="text-base">No payment records found.</p>
          <p className="text-sm mt-1">Your payment history will appear here after you make a payment.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Transaction ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Semester</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payments.map(p => {
                  const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  const Icon = sc.icon;
                  return (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                      <td className="px-5 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{p.tranId}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Semester {p.semester}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        BDT {p.amount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {p.paidAt
                          ? new Date(p.paidAt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })
                          : new Date(p.createdAt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}>
                          <Icon size={11} /> {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {p.status === 'completed' && (
                          <button
                            onClick={() => handleDownload(p)}
                            disabled={downloading[p._id]}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition disabled:opacity-60"
                          >
                            {downloading[p._id]
                              ? <FiLoader size={12} className="animate-spin" />
                              : <FiDownload size={12} />
                            }
                            PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
