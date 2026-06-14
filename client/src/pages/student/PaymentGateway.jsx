import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import paymentService from '../../services/paymentService';
import { FiCreditCard, FiCheckCircle, FiAlertCircle, FiLoader, FiDollarSign } from 'react-icons/fi';

const STATUS_BADGE = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  failed:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export default function PaymentGateway() {
  const { user } = useAuth();
  const [feeConfigs, setFeeConfigs]     = useState([]);
  const [statusMap, setStatusMap]       = useState({});
  const [loadingInit, setLoadingInit]   = useState({});
  const [error, setError]               = useState('');
  const [fetchingFees, setFetchingFees] = useState(true);

  const currentSemester = user?.semester || 1;

  useEffect(() => {
    const load = async () => {
      try {
        const configs = await paymentService.getFeeConfig();
        setFeeConfigs(Array.isArray(configs) ? configs : []);

        // Fetch payment status for each semester
        const statuses = {};
        await Promise.all(
          (Array.isArray(configs) ? configs : []).map(async (cfg) => {
            try {
              const s = await paymentService.getSemesterPaymentStatus(cfg.semester);
              statuses[cfg.semester] = s;
            } catch {
              statuses[cfg.semester] = { paid: false };
            }
          })
        );
        setStatusMap(statuses);
      } catch {
        setError('Failed to load fee configuration.');
      } finally {
        setFetchingFees(false);
      }
    };
    load();
  }, []);

  const handlePay = async (semester) => {
    setLoadingInit(p => ({ ...p, [semester]: true }));
    setError('');
    try {
      const res = await paymentService.initiatePayment(semester, String(new Date().getFullYear()));
      // Redirect to SSLCommerz gateway
      if (res.GatewayPageURL) {
        window.location.href = res.GatewayPageURL;
      } else {
        setError('Could not get payment gateway URL. Please try again.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setLoadingInit(p => ({ ...p, [semester]: false }));
    }
  };

  if (fetchingFees) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="animate-spin text-primary-600" size={28} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Semester Fee Payment</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pay your semester enrollment fee securely via SSLCommerz.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {feeConfigs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FiDollarSign size={40} className="mx-auto mb-3 opacity-40" />
          <p>No fee configuration found. Please contact the admin.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {feeConfigs.map(cfg => {
            const st        = statusMap[cfg.semester];
            const paid      = st?.paid;
            const isPending = st?.payment?.status === 'pending';
            const isCurrent = cfg.semester === currentSemester;

            return (
              <div
                key={cfg.semester}
                className={`bg-white dark:bg-gray-800 rounded-xl border p-5 flex items-center justify-between gap-4 shadow-sm
                  ${isCurrent ? 'border-primary-400 dark:border-primary-600' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Semester {cfg.semester}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  {cfg.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cfg.description}</p>
                  )}
                  {cfg.academicYear && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Academic Year: {cfg.academicYear}
                    </p>
                  )}
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mt-1">
                    BDT {cfg.amount?.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  {paid ? (
                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_BADGE.completed}`}>
                      <FiCheckCircle size={13} /> Paid
                    </span>
                  ) : isPending ? (
                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_BADGE.pending}`}>
                      Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePay(cfg.semester)}
                      disabled={!!loadingInit[cfg.semester]}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-60"
                    >
                      {loadingInit[cfg.semester]
                        ? <FiLoader className="animate-spin" size={14} />
                        : <FiCreditCard size={14} />
                      }
                      Pay Now
                    </button>
                  )}

                  {st?.payment && !paid && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[st.payment.status] || ''}`}>
                      {st.payment.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info note */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-400">
        <p className="font-medium mb-1">Payment Information</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs">
          <li>Payments are processed securely via SSLCommerz gateway.</li>
          <li>Accepted: Visa, MasterCard, bKash, Nagad, Rocket, and more.</li>
          <li>After successful payment, your receipt will be available in Payment History.</li>
          <li>For failed transactions, the amount will not be deducted from your account.</li>
        </ul>
      </div>
    </div>
  );
}
