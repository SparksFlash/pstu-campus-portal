import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiArrowLeft, FiCheckCircle, FiSend } from 'react-icons/fi';

const PLANS = ['Starter (৳3,000/মাস)', 'Pro (৳8,000/মাস)', 'Enterprise (Custom)'];
const TYPES = ['Public University', 'Private University', 'College', 'Technical Institute', 'Other'];
const SIZES = ['Less than 500 students', '500–1,000 students', '1,000–3,000 students', '3,000–10,000 students', 'More than 10,000 students'];

export default function InstitutionRegister() {
  const [form, setForm] = useState({
    universityName: '', location: '', type: '', estimatedStudents: '',
    contactName: '', contactEmail: '', contactPhone: '', plan: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.universityName.trim()) e.universityName = 'Required';
    if (!form.location.trim()) e.location = 'Required';
    if (!form.type) e.type = 'Required';
    if (!form.contactName.trim()) e.contactName = 'Required';
    if (!form.contactEmail.trim() || !form.contactEmail.includes('@')) e.contactEmail = 'Valid email required';
    if (!form.contactPhone.trim()) e.contactPhone = 'Required';
    if (!form.plan) e.plan = 'Please select a plan';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <FiCheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-500 mb-2">
            Thank you, <strong>{form.contactName}</strong>!
          </p>
          <p className="text-gray-500 text-sm mb-6">
            We've received the registration request for <strong>{form.universityName}</strong>.
            Our team will contact you at <strong>{form.contactEmail}</strong> within <strong>24 hours</strong>.
          </p>
          <div className="bg-primary-50 rounded-xl p-4 text-sm text-primary-700 mb-6">
            <p className="font-semibold mb-1">Selected Plan: {form.plan}</p>
            <p>We'll set up a 30-day free trial while your subscription is being processed.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-outline text-sm">Back to Home</Link>
            <Link to="/login" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition">
              Login to Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const field = (name, label, required = true) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={`input w-full ${errors[name] ? 'border-red-300 bg-red-50' : ''}`}
        placeholder={label}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  const select = (name, label, options, required = true) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={`input w-full ${errors[name] ? 'border-red-300 bg-red-50' : ''}`}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <FiBook size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">EduPortal BD</span>
        </div>
        <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
          <FiArrowLeft size={14} /> Back to Home
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Register Your Institution</h1>
          <p className="text-gray-500 mt-2">Fill in the details below and we'll get you started within 24 hours.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          {/* Institution info */}
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Institution Details
            </h2>
            <div className="space-y-4">
              {field('universityName', 'University / Institution Name')}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('location', 'Location (City / District)')}
                {select('type', 'Institution Type', TYPES)}
              </div>
              {select('estimatedStudents', 'Estimated Number of Students', SIZES, false)}
            </div>
          </div>

          {/* Contact info */}
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Admin Contact
            </h2>
            <div className="space-y-4">
              {field('contactName', 'Contact Person Name')}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('contactEmail', 'Email Address')}
                {field('contactPhone', 'Phone Number')}
              </div>
            </div>
          </div>

          {/* Plan */}
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Subscription Plan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PLANS.map(p => (
                <label
                  key={p}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                    form.plan === p ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p}
                    checked={form.plan === p}
                    onChange={handleChange}
                    className="accent-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{p}</span>
                </label>
              ))}
            </div>
            {errors.plan && <p className="text-xs text-red-500 mt-2">{errors.plan}</p>}
            <p className="text-xs text-gray-400 mt-2">
              Not sure? Select any plan — we'll discuss during setup. <Link to="/pricing" className="text-primary-600 hover:underline">View full comparison →</Link>
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              className="input w-full resize-none"
              placeholder="Any specific requirements or questions..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-60 text-sm"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <FiSend size={16} /> Submit Registration Request
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            By submitting, you agree to our Terms of Service. We'll contact you within 24 hours to complete setup.
          </p>
        </form>
      </div>
    </div>
  );
}
