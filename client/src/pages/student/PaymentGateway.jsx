import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import paymentService from '../../services/paymentService';
import { semesterLabel } from '../../utils/formatters';
import {
  FiCreditCard, FiCheckCircle, FiAlertCircle, FiLoader,
  FiDollarSign, FiInfo,
} from 'react-icons/fi';

function Row({ label, value, bold, accent, border }) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-4
      ${border ? 'border-t border-gray-200 dark:border-gray-700' : ''}
      ${accent ? 'bg-primary-50 dark:bg-primary-900/20 rounded-b-lg' : ''}`}
    >
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
        {label}
      </span>
      <span className={`text-sm font-semibold ${accent ? 'text-primary-700 dark:text-primary-400 text-base' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  );
}

export default function PaymentGateway() {
  const { user } = useAuth();
  const [breakdown, setBreakdown]   = useState(null);
  const [semStatus, setSemStatus]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [paying, setPaying]         = useState(false);
  const [error, setError]           = useState('');

  const semester = user?.semester || 1;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [bd, st] = await Promise.all([
          paymentService.getFeeBreakdown(semester),
          paymentService.getSemesterPaymentStatus(semester),
        ]);
        setBreakdown(bd);
        setSemStatus(st);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
          'Could not load fee information. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };
    if (semester) load();
  }, [semester]);

  const handlePay = async () => {
    setPaying(true);
    setError('');
    try {
      const res = await paymentService.initiatePayment(semester, String(new Date().getFullYear()));
      if (res.GatewayPageURL) {
        window.location.href = res.GatewayPageURL;
      } else {
        setError('Could not get payment gateway URL. Please try again.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="animate-spin text-primary-600" size={28} />
      </div>
    );
  }

  const paid    = semStatus?.paid;
  const pending = semStatus?.payment?.status === 'pending';

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Semester Fee Payment</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {semesterLabel(semester)} — fee calculated from enrolled course credit hours.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          <FiAlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* No courses configured */}
      {!breakdown && !error && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <FiDollarSign size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No courses found for {semesterLabel(semester)}.</p>
          <p className="text-sm mt-1">Please contact the admin to add courses for your semester.</p>
        </div>
      )}

      {/* Fee breakdown card */}
      {breakdown && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <FiDollarSign size={16} className="text-primary-600 dark:text-primary-400" />
              <span className="font-semibold text-sm text-gray-800 dark:text-white">
                {semesterLabel(semester)} Fee Breakdown
              </span>
            </div>
            {paid && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <FiCheckCircle size={11} /> Paid
              </span>
            )}
            {pending && !paid && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                Payment Pending
              </span>
            )}
          </div>

          {/* Breakdown rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            <Row
              label={`Total Credit Hours`}
              value={`${breakdown.totalCredits} Cr`}
            />
            <Row
              label={`Credit Hour Charge (${breakdown.totalCredits} × ${breakdown.creditFee / breakdown.totalCredits} BDT)`}
              value={`BDT ${breakdown.creditFee.toLocaleString('en-BD')}`}
            />
            <Row
              label="Admission Fee"
              value={`BDT ${breakdown.admissionFee.toLocaleString('en-BD')}`}
            />
            <Row
              label="Enrollment Fee"
              value={`BDT ${breakdown.enrollmentFee.toLocaleString('en-BD')}`}
            />
            <Row
              label="Hall Fee"
              value={`BDT ${breakdown.hallFee.toLocaleString('en-BD')}`}
            />
            <Row
              label="CSE Club Fee"
              value={`BDT ${breakdown.cseClubFee.toLocaleString('en-BD')}`}
            />
            <Row
              label="Grand Total"
              value={`BDT ${breakdown.total.toLocaleString('en-BD')}`}
              bold
              accent
              border
            />
          </div>

          {/* Pay button */}
          {!paid && (
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 px-6 py-3
                  bg-primary-600 hover:bg-primary-700 text-white rounded-lg
                  text-sm font-semibold transition disabled:opacity-60"
              >
                {paying
                  ? <><FiLoader className="animate-spin" size={15} /> Redirecting to gateway…</>
                  : <><FiCreditCard size={15} /> Pay BDT {breakdown.total.toLocaleString('en-BD')}</>
                }
              </button>
              {pending && (
                <p className="text-center text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  A previous payment attempt is pending. Clicking Pay Now will start a fresh attempt.
                </p>
              )}
            </div>
          )}

          {/* Already paid */}
          {paid && semStatus.payment && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Payment completed on{' '}
                {new Date(semStatus.payment.paidAt || semStatus.payment.createdAt).toLocaleDateString('en-BD', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Txn: {semStatus.payment.tranId}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="flex gap-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-400">
        <FiInfo size={16} className="shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs leading-relaxed">
          <p className="font-semibold text-sm mb-1">Payment Information</p>
          <p>Fee is calculated dynamically from your semester's total course credit hours.</p>
          <p>Payments are processed securely via SSLCommerz — Visa, MasterCard, bKash, Nagad, Rocket accepted.</p>
          <p>Download your receipt from Payment History after a successful transaction.</p>
        </div>
      </div>
    </div>
  );
}
