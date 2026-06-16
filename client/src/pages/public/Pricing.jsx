import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiBook, FiArrowLeft } from 'react-icons/fi';

const PLANS = [
  {
    name: 'Starter',
    monthlyPrice: 3000,
    yearlyPrice: 2400,
    students: '≤ 500 students',
    highlight: false,
    color: 'border-gray-200',
    features: [
      { text: 'Notice Board (create, edit, delete)', included: true },
      { text: 'Bus Schedule Management', included: true },
      { text: 'Phone Directory', included: true },
      { text: 'Basic Grade Entry & GPA', included: true },
      { text: 'Email Verification', included: true },
      { text: 'Student & Teacher Profiles', included: true },
      { text: 'Online Fee Payment', included: false },
      { text: 'Bulk CSV Grade Import', included: false },
      { text: 'Audit Logs', included: false },
      { text: 'Google Sign-In', included: false },
      { text: 'Custom Branding', included: false },
    ],
  },
  {
    name: 'Pro',
    monthlyPrice: 8000,
    yearlyPrice: 6400,
    students: '≤ 3,000 students',
    highlight: true,
    color: 'border-primary-500',
    features: [
      { text: 'Notice Board (create, edit, delete)', included: true },
      { text: 'Bus Schedule Management', included: true },
      { text: 'Phone Directory', included: true },
      { text: 'Advanced Grade Entry & CGPA', included: true },
      { text: 'Email Verification', included: true },
      { text: 'Student & Teacher Profiles', included: true },
      { text: 'Online Fee Payment (SSLCommerz)', included: true },
      { text: 'Bulk CSV Grade Import', included: true },
      { text: 'Audit Logs', included: true },
      { text: 'Google Sign-In', included: true },
      { text: 'Custom Branding', included: false },
    ],
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    yearlyPrice: null,
    students: 'Unlimited students',
    highlight: false,
    color: 'border-gray-200',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Custom Branding & Domain', included: true },
      { text: 'Dedicated Server', included: true },
      { text: 'SLA Agreement (99.9% uptime)', included: true },
      { text: 'Priority 24/7 Support', included: true },
      { text: 'On-site Staff Training', included: true },
      { text: 'Data Export & Backup', included: true },
      { text: 'API Access', included: true },
      { text: 'Custom Feature Development', included: true },
      { text: 'Multi-campus Support', included: true },
      { text: 'White-label Option', included: true },
    ],
  },
];

const FAQ = [
  { q: 'Can we try before subscribing?', a: 'Yes — request a demo and we will set up a 30-day free trial for your institution.' },
  { q: 'Is our data secure?', a: 'All data is stored in MongoDB Atlas (cloud) with encrypted connections. Each institution\'s data is isolated.' },
  { q: 'Can we switch plans later?', a: 'Absolutely. You can upgrade or downgrade at any billing cycle.' },
  { q: 'What payment methods are accepted?', a: 'Bank transfer, bKash, Nagad, and all cards via SSLCommerz.' },
  { q: 'Do you offer discounts for public universities?', a: 'Yes — government universities get 25% off on annual billing. Contact us for details.' },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <FiBook size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">EduPortal BD</span>
        </div>
        <div className="flex gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
            <FiArrowLeft size={14} /> Home
          </Link>
          <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary-600 px-3 py-1.5 transition">Login</Link>
          <Link to="/institution/register" className="text-sm font-medium bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-700 transition">
            Get Started
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Simple, Transparent Pricing</h1>
          <p className="text-gray-500 text-lg mb-7">Per university, per month. No hidden fees. Cancel anytime.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${!yearly ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${yearly ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Yearly
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl border-2 p-7 relative transition hover:shadow-lg ${
                plan.highlight
                  ? 'border-primary-500 shadow-xl bg-primary-600 text-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-xs font-black px-4 py-1 rounded-full shadow">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <h2 className={`text-2xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h2>
              <p className={`text-sm mb-4 ${plan.highlight ? 'text-primary-200' : 'text-gray-400'}`}>
                {plan.students}
              </p>

              <div className="mb-6">
                {plan.monthlyPrice ? (
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                      ৳{(yearly ? plan.yearlyPrice : plan.monthlyPrice).toLocaleString()}
                    </span>
                    <span className={`text-sm mb-1.5 ${plan.highlight ? 'text-primary-200' : 'text-gray-400'}`}>
                      /মাস
                    </span>
                  </div>
                ) : (
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    Custom
                  </span>
                )}
                {yearly && plan.monthlyPrice && (
                  <p className={`text-xs mt-1 ${plan.highlight ? 'text-primary-200' : 'text-green-600'}`}>
                    Billed ৳{(plan.yearlyPrice * 12).toLocaleString()} /year
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-7">
                {plan.features.map(f => (
                  <li key={f.text} className="flex items-start gap-2 text-sm">
                    <FiCheck
                      size={15}
                      className={`mt-0.5 flex-shrink-0 ${
                        f.included
                          ? plan.highlight ? 'text-primary-200' : 'text-green-500'
                          : 'text-gray-200'
                      }`}
                    />
                    <span className={
                      f.included
                        ? plan.highlight ? 'text-primary-100' : 'text-gray-700'
                        : 'text-gray-300 line-through'
                    }>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/institution/register"
                className={`block text-center py-3 rounded-xl font-bold text-sm transition ${
                  plan.highlight
                    ? 'bg-white text-primary-700 hover:bg-primary-50'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {plan.monthlyPrice ? 'Get Started' : 'Contact Sales'}
              </Link>
            </div>
          ))}
        </div>

        {/* Market stats */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-2xl p-8 text-white text-center mb-16">
          <h2 className="text-2xl font-bold mb-2">Why EduPortal BD?</h2>
          <p className="text-primary-200 mb-7">Bangladesh has 150+ universities. We're here to modernize all of them.</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { val: '150+', label: 'Universities in BD' },
              { val: '৳4L+', label: 'Monthly potential revenue at 50 clients' },
              { val: '0', label: 'Installation required' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-black">{s.val}</p>
                <p className="text-primary-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map(item => (
              <div key={item.q} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-1.5">{item.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/institution/register"
              className="inline-block bg-primary-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-700 transition"
            >
              Register Your Institution →
            </Link>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 text-sm px-6 py-8 text-center mt-16">
        <p className="font-semibold text-white mb-1">EduPortal BD</p>
        <p>Campus Management SaaS · Made for Bangladeshi Universities</p>
      </footer>
    </div>
  );
}
