import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiXCircle, FiRefreshCw, FiList } from 'react-icons/fi';

const REASON_MESSAGES = {
  not_found:         'Transaction record not found.',
  validation_failed: 'Payment validation failed. The payment could not be verified.',
  amount_mismatch:   'Amount mismatch detected. The payment was rejected for security reasons.',
  server_error:      'A server error occurred while processing your payment.',
};

export default function PaymentFail() {
  const [searchParams] = useSearchParams();
  const reason  = searchParams.get('reason');
  const tranId  = searchParams.get('tran_id');

  const message = REASON_MESSAGES[reason] || 'Your payment was not completed. No amount has been deducted.';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {/* Fail icon */}
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <FiXCircle size={40} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Failed</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{message}</p>

        {tranId && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-6 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Transaction ID: </span>
            <span className="font-mono text-gray-700 dark:text-gray-300">{tranId}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/student/payments"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition"
          >
            <FiRefreshCw size={14} /> Try Again
          </Link>
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
