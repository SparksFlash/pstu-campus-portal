const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const allowRoles = require('../middleware/roleAuth');
const ctrl       = require('../controllers/paymentController');

// ── Fee config ────────────────────────────────────────────────────────
router.get('/fee-config',  auth, ctrl.getFeeConfig);
router.post('/fee-config', auth, allowRoles('admin'), ctrl.setFeeConfig);

// ── SSLCommerz gateway callbacks (NO auth — browser POST redirect) ────
router.post('/success', ctrl.handleSuccess);
router.post('/fail',    ctrl.handleFail);
router.post('/cancel',  ctrl.handleCancel);
router.post('/ipn',     ctrl.handleIPN);

// ── Student endpoints ─────────────────────────────────────────────────
router.post('/initiate',                    auth, allowRoles('student'), ctrl.initiatePayment);
router.get('/fee-breakdown/:semester',      auth, allowRoles('student'), ctrl.getFeeBreakdown);
router.get('/my',                           auth, allowRoles('student'), ctrl.getMyPayments);
router.get('/by-tran/:tranId',              auth, allowRoles('student'), ctrl.getPaymentByTranId);
router.get('/semester-status/:semester',    auth, allowRoles('student'), ctrl.getSemesterPaymentStatus);

// ── Admin endpoints ───────────────────────────────────────────────────
router.get('/admin/all',   auth, allowRoles('admin'), ctrl.getAllPayments);
router.get('/admin/stats', auth, allowRoles('admin'), ctrl.getPaymentStats);

module.exports = router;
