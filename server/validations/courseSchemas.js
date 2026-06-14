const Joi = require('joi');

exports.createCourseSchema = Joi.object({
  code:        Joi.string().trim().uppercase().max(20).required(),
  title:       Joi.string().trim().min(3).max(200).required(),
  faculty:     Joi.string().hex().length(24).required(),
  semester:    Joi.number().integer().min(1).max(8).required(),
  creditHours: Joi.number().min(0.5).max(6).required(),
  totalMarks:  Joi.number().min(1).max(1000).default(100),
  teacher:     Joi.string().hex().length(24).optional(),
  description: Joi.string().max(1000).optional(),
});

exports.updateCourseSchema = Joi.object({
  code:        Joi.string().trim().uppercase().max(20).optional(),
  title:       Joi.string().trim().min(3).max(200).optional(),
  faculty:     Joi.string().hex().length(24).optional(),
  semester:    Joi.number().integer().min(1).max(8).optional(),
  creditHours: Joi.number().min(0.5).max(6).optional(),
  totalMarks:  Joi.number().min(1).max(1000).optional(),
  teacher:     Joi.string().hex().length(24).optional(),
  description: Joi.string().max(1000).optional(),
});
