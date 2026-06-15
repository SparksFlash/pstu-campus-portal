const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  verifyEmailAndRedirect,
  forgotPassword,
  resetPassword,
  googleAuth,
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/authSchemas');

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post('/register', register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
router.post('/login', validate(loginSchema), login);

/**
 * @openapi
 * /auth/verify:
 *   get:
 *     summary: Verify email with token (query param)
 *     tags: [Auth]
 */
router.get('/verify', verifyEmail);
router.get('/verify/:token', verifyEmailAndRedirect);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

/**
 * @openapi
 * /auth/google:
 *   post:
 *     summary: Sign in or register with Google
 *     tags: [Auth]
 */
router.post('/google', googleAuth);

module.exports = router;
