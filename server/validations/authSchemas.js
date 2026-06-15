const Joi = require('joi');

const passwordRules = Joi.string()
  .min(6)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('Password must be at least 6 characters and contain uppercase, lowercase, and a digit');

exports.registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('student', 'teacher', 'admin').required(),
  faculty: Joi.string().hex().length(24).optional(),
  registrationNumber: Joi.string().optional(),
  studentId: Joi.string().optional(),
  phone: Joi.string().optional(),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().lowercase().allow('').optional(),
  password: Joi.string().required(),
  role: Joi.string().valid('student', 'teacher', 'admin').allow('').optional(),
  registrationNumber: Joi.string().allow('').optional(),
  studentId: Joi.string().allow('').optional(),
  faculty: Joi.alternatives()
    .try(Joi.string().hex().length(24))
    .allow('')
    .optional(),
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

exports.resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  password: passwordRules.required(),
});

exports.changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordRules.required(),
});
