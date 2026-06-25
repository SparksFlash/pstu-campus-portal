import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiDownload, FiLoader, FiList } from 'react-icons/fi';
import paymentService from '../../services/paymentService';
import { generateReceiptPDF } from '../../utils/generateReceiptPDF';

export default function PaymentSuccess() {
  const [searchParams]           = useSearchParams();
  const tranId                   = searchParams.get('tran_id');
  const [payment, setPayment]    = useState(null);
  const [loading, setLoading]    = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!tranId) { setLoading(false); return; }
    paymentService.getPaymentByTranId(tranId)
      .then(setPayment)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tranId]);

  const handleDownload = async () => {
    if (!payment) return;
    setDownloading(true);
    try { await generateReceiptPDF(payment); }
    catch { alert('Failed to generate receipt.'); }
    finally { setDownloading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <FiCheckCircle size={40} className="text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Your semester enrollment fee has been paid successfully.
        </p>

        {loading ? (
          <div className="flex justify-center py-4">
            <FiLoader className="animate-spin text-primary-600" size={24} />
          </div>
        ) : payment ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-left text-sm space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
              <span className="font-mono font-medium text-gray-800 dark:text-gray-200 text-xs">{payment.tranId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Semester</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">Semester {payment.semester}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Amount</span>
              <span className="font-bold text-green-600">BDT {payment.amount?.toLocaleString()}</span>
            </div>
            {payment.paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Date</span>
                <span className="text-gray-700 dark:text-gray-300 text-xs">
                  {new Date(payment.paidAt).toLocaleString('en-BD')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
            Transaction ID: <span className="font-mono">{tranId || 'N/A'}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {payment?.status === 'completed' && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
            >
              {downloading ? <FiLoader size={14} className="animate-spin" /> : <FiDownload size={14} />}
              Download Receipt
            </button>
          )}
          <Link
            to="/student/payments/history"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition"
          >
            <FiList size={14} /> Payment History
          </Link>
        </div>

        <Link
          to="/student/dashboard"
          className="block mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
