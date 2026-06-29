const SSLCommerzPayment = require('sslcommerz-lts');
const { v4: uuidv4 }   = require('uuid');
const Payment           = require('../models/Payment');
const FeeConfig         = require('../models/FeeConfig');
const Course            = require('../models/Course');
const User              = require('../models/User');
const { SEMESTER_FEE }  = require('../config/constants');

async function calculateSemesterFee(semester, facultyId) {
  const courses      = await Course.find({ semester: parseInt(semester), faculty: facultyId }).select('creditHours');
  const totalCredits = courses.reduce((s, c) => s + (c.creditHours || 0), 0);
  if (totalCredits === 0) return null;
  const creditFee = totalCredits * SEMESTER_FEE.creditHourRate;
  const total     = creditFee + SEMESTER_FEE.admissionFee + SEMESTER_FEE.enrollmentFee
                    + SEMESTER_FEE.hallFee + SEMESTER_FEE.cseClubFee;
  return {
    totalCredits,
    creditFee,
    admissionFee:  SEMESTER_FEE.admissionFee,
    enrollmentFee: SEMESTER_FEE.enrollmentFee,
    hallFee:       SEMESTER_FEE.hallFee,
    cseClubFee:    SEMESTER_FEE.cseClubFee,
    total,
  };
}

const STORE_ID   = process.env.SSLC_STORE_ID;
const STORE_PASS = process.env.SSLC_STORE_PASS;
const IS_LIVE    = process.env.SSLC_IS_LIVE === 'true';
const SERVER_URL = process.env.SERVER_URL   || 'http://localhost:5000';
const CLIENT_URL = process.env.CLIENT_URL   || 'http://localhost:3000';

// ── Fee Configuration (Admin) ────────────────────────────────────────

exports.getFeeConfig = async (req, res) => {
  try {
    const configs = await FeeConfig.find().sort({ semester: 1 });
    res.json(configs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.setFeeConfig = async (req, res) => {
  try {
    const { semester, amount, description, academicYear } = req.body;
    if (!semester || amount == null) return res.status(400).json({ message: 'semester and amount are required' });

    const config = await FeeConfig.findOneAndUpdate(
      { semester },
      { semester, amount, description, academicYear, updatedBy: req.user._id, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Initiate Payment (Student) ────────────────────────────────────────

exports.initiatePayment = async (req, res) => {
  try {
    const { semester, academicYear } = req.body;
    if (!semester) return res.status(400).json({ message: 'semester is required' });

    const student = await User.findById(req.user._id).populate('faculty', 'name');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Calculate fee dynamically from courses in this semester
    const breakdown = await calculateSemesterFee(semester, student.faculty?._id || student.faculty);
    if (!breakdown) {
      return res.status(400).json({
        message: `No courses found for Semester ${semester}. Please contact admin.`,
      });
    }

    // Prevent duplicate: block if active/completed payment exists for same student+semester
    const existing = await Payment.findOne({
      student: student._id,
      semester,
      status: { $in: ['pending', 'completed'] },
    });
    if (existing) {
      if (existing.status === 'completed') {
        return res.status(400).json({ message: `Semester ${semester} fee already paid.`, payment: existing });
      }
      // Stale pending — delete and recreate with fresh amount
      await Payment.deleteOne({ _id: existing._id });
    }

    const tranId = `PSTU-${uuidv4().split('-')[0].toUpperCase()}-S${semester}`;

    // Save pending payment
    const payment = await Payment.create({
      student:      student._id,
      faculty:      student.faculty?._id || student.faculty,
      semester,
      academicYear: academicYear || String(new Date().getFullYear()),
      amount:       breakdown.total,
      currency:     'BDT',
      purpose:      'semester_fee',
      status:       'pending',
      tranId,
    });

    // Build SSLCommerz payload
    const sslData = {
      total_amount:     breakdown.total,
      currency:         'BDT',
      tran_id:          tranId,
      success_url:      `${SERVER_URL}/api/v1/payments/success`,
      fail_url:         `${SERVER_URL}/api/v1/payments/fail`,
      cancel_url:       `${SERVER_URL}/api/v1/payments/cancel`,
      ipn_url:          `${SERVER_URL}/api/v1/payments/ipn`,
      shipping_method:  'NO',           // digital / fee payment — no physical shipment
      product_name:     `PSTU Semester ${semester} Enrollment Fee`,
      product_category: 'education',
      product_profile:  'general',
      num_of_item:      1,
      weight_of_items:  0,
      amount_of_delivery_charge: 0,
      cus_name:         student.name,
      cus_email:        student.email,
      cus_add1:         'PSTU Campus, Dumki, Patuakhali',
      cus_city:         'Patuakhali',
      cus_postcode:     '8602',
      cus_country:      'Bangladesh',
      cus_phone:        student.phone || '01700000000',
      cus_fax:          'N/A',
      ship_name:        student.name,
      ship_add1:        'PSTU Campus',
      ship_city:        'Patuakhali',
      ship_postcode:    '8602',
      ship_country:     'Bangladesh',
    };

    const sslcz      = new SSLCommerzPayment(STORE_ID, STORE_PASS, IS_LIVE);
    const apiResponse = await sslcz.init(sslData);

    if (!apiResponse?.GatewayPageURL) {
      await Payment.deleteOne({ _id: payment._id });
      console.error('SSLCommerz init failed:', apiResponse);
      return res.status(502).json({ message: 'Payment gateway error. Please try again.' });
    }

    res.json({ GatewayPageURL: apiResponse.GatewayPageURL, tranId });
  } catch (err) {
    console.error('initiatePayment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── SSLCommerz Callbacks (no auth — browser redirect POST) ────────────

exports.handleSuccess = async (req, res) => {
  try {
    const { val_id, tran_id, amount, card_type, bank_tran_id, status } = req.body;

    const payment = await Payment.findOne({ tranId: tran_id });
    if (!payment) return res.redirect(`${CLIENT_URL}/payment/fail?reason=not_found`);

    // Validate with SSLCommerz
    const sslcz    = new SSLCommerzPayment(STORE_ID, STORE_PASS, IS_LIVE);
    const validated = await sslcz.validate({ val_id });

    if (validated?.status !== 'VALID' && validated?.status !== 'VALIDATED') {
      payment.status          = 'failed';
      payment.gatewayResponse = validated;
      await payment.save();
      return res.redirect(`${CLIENT_URL}/payment/fail?reason=validation_failed&tran_id=${tran_id}`);
    }

    // Double-check amount matches
    if (parseFloat(validated.amount) !== payment.amount) {
      payment.status          = 'failed';
      payment.gatewayResponse = { ...validated, reason: 'amount_mismatch' };
      await payment.save();
      return res.redirect(`${CLIENT_URL}/payment/fail?reason=amount_mismatch&tran_id=${tran_id}`);
    }

    payment.status          = 'completed';
    payment.valId           = val_id;
    payment.bankTranId      = bank_tran_id;
    payment.paidAt          = new Date();
    payment.gatewayResponse = validated;
    await payment.save();

    res.redirect(`${CLIENT_URL}/payment/success?tran_id=${tran_id}`);
  } catch (err) {
    console.error('handleSuccess error:', err);
    res.redirect(`${CLIENT_URL}/payment/fail?reason=server_error`);
  }
};

exports.handleFail = async (req, res) => {
  try {
    const { tran_id } = req.body;
    if (tran_id) {
      await Payment.findOneAndUpdate(
        { tranId: tran_id, status: 'pending' },
        { status: 'failed', gatewayResponse: req.body }
      );
    }
    res.redirect(`${CLIENT_URL}/payment/fail?tran_id=${tran_id || ''}`);
  } catch (err) {
    res.redirect(`${CLIENT_URL}/payment/fail`);
  }
};

exports.handleCancel = async (req, res) => {
  try {
    const { tran_id } = req.body;
    if (tran_id) {
      await Payment.findOneAndUpdate(
        { tranId: tran_id, status: 'pending' },
        { status: 'cancelled', gatewayResponse: req.body }
      );
    }
    res.redirect(`${CLIENT_URL}/payment/cancel?tran_id=${tran_id || ''}`);
  } catch (err) {
    res.redirect(`${CLIENT_URL}/payment/cancel`);
  }
};

// IPN — server-to-server (optional, won't fire on localhost sandbox)
exports.handleIPN = async (req, res) => {
  try {
    const { val_id, tran_id } = req.body;

    // Verify the transaction with SSLCommerz before trusting the status
    if (!val_id) return res.status(200).end();

    const sslcz = new SSLCommerzPayment(STORE_ID, STORE_PASS, IS_LIVE);
    const validation = await sslcz.validate({ val_id });

    if (
      (validation?.status === 'VALID' || validation?.status === 'VALIDATED') &&
      validation?.tran_id === tran_id
    ) {
      const payment = await Payment.findOne({ tranId: tran_id, status: 'pending' });
      if (payment) {
        // Guard: amount must match what we stored
        const expected = parseFloat(payment.amount);
        const received = parseFloat(validation.amount);
        if (Math.abs(expected - received) < 1) {
          payment.status       = 'completed';
          payment.valId        = val_id;
          payment.bankTranId   = validation.bank_tran_id;
          payment.paidAt       = new Date();
          payment.gatewayResponse = validation;
          await payment.save();
        }
      }
    }

    res.status(200).end();
  } catch {
    res.status(200).end(); // always 200 to IPN
  }
};

// ── Student Endpoints ─────────────────────────────────────────────────

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .populate('faculty', 'name');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPaymentByTranId = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      tranId:  req.params.tranId,
      student: req.user._id,
    }).populate('student', 'name email registrationNumber studentId').populate('faculty', 'name');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSemesterPaymentStatus = async (req, res) => {
  try {
    const { semester } = req.params;
    const [payment, breakdown] = await Promise.all([
      Payment.findOne({ student: req.user._id, semester, status: 'completed' }),
      calculateSemesterFee(semester, req.user.faculty),
    ]);
    res.json({
      paid:        !!payment,
      payment:     payment || null,
      feeBreakdown: breakdown || null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getFeeBreakdown = async (req, res) => {
  try {
    const breakdown = await calculateSemesterFee(req.params.semester, req.user.faculty);
    if (!breakdown) {
      return res.status(404).json({ message: `No courses configured for Semester ${req.params.semester} yet.` });
    }
    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Admin Endpoints ───────────────────────────────────────────────────

exports.getAllPayments = async (req, res) => {
  try {
    const { status, semester, faculty, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (semester) filter.semester = parseInt(semester);
    if (faculty)  filter.faculty  = faculty;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('student', 'name email registrationNumber')
        .populate('faculty', 'name'),
      Payment.countDocuments(filter),
    ]);

    res.json({ payments, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const [total, completed, pending, failed, cancelled, revenue] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'completed' }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.countDocuments({ status: 'cancelled' }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);
    res.json({
      total, completed, pending, failed, cancelled,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
