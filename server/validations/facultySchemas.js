const Joi = require('joi');

exports.createFacultySchema = Joi.object({
  name:                   Joi.string().trim().min(2).max(200).required(),
  code:                   Joi.string().trim().uppercase().max(20).required(),
  description:            Joi.string().max(1000).optional(),
  dean:                   Joi.string().hex().length(24).optional(),
  totalSemesters:         Joi.number().integer().min(1).max(16).default(8),
  totalStudentPerSemester: Joi.number().integer().min(1).max(500).default(80),
});

exports.updateFacultySchema = Joi.object({
  name:                   Joi.string().trim().min(2).max(200).optional(),
  code:                   Joi.string().trim().uppercase().max(20).optional(),
  description:            Joi.string().max(1000).optional(),
  dean:                   Joi.string().hex().length(24).optional(),
  totalSemesters:         Joi.number().integer().min(1).max(16).optional(),
  totalStudentPerSemester: Joi.number().integer().min(1).max(500).optional(),
});
