const Joi = require('joi');

exports.updateProfileSchema = Joi.object({
  name:        Joi.string().trim().min(2).max(100).optional(),
  phone:       Joi.string().max(20).optional(),
  address:     Joi.string().max(500).optional(),
  dateOfBirth: Joi.date().iso().optional(),
});

exports.updateUserSchema = Joi.object({
  name:               Joi.string().trim().min(2).max(100).optional(),
  email:              Joi.string().email().lowercase().optional(),
  phone:              Joi.string().max(20).optional(),
  faculty:            Joi.string().hex().length(24).optional(),
  role:               Joi.string().valid('student', 'teacher', 'admin').optional(),
  isActive:           Joi.boolean().optional(),
  registrationNumber: Joi.string().optional(),
  studentId:          Joi.string().optional(),
  employeeId:         Joi.string().optional(),
  semester:           Joi.number().integer().min(1).max(8).optional(),
});
