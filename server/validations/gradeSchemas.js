const Joi = require('joi');

exports.addGradeSchema = Joi.object({
  student:      Joi.string().hex().length(24).required(),
  course:       Joi.string().hex().length(24).required(),
  faculty:      Joi.string().hex().length(24).optional(),
  semester:     Joi.number().integer().min(1).max(8).required(),
  obtainedMarks: Joi.number().min(0).required(),
  totalMarks:    Joi.number().min(1).required(),
  teacher:      Joi.string().hex().length(24).optional(),
});

exports.updateGradeSchema = Joi.object({
  obtainedMarks: Joi.number().min(0).required(),
  totalMarks:    Joi.number().min(1).required(),
});

exports.recordGradeSchema = Joi.object({
  student:      Joi.string().hex().length(24).required(),
  course:       Joi.string().hex().length(24).required(),
  semester:     Joi.number().integer().min(1).max(8).required(),
  obtainedMarks: Joi.number().min(0).required(),
  totalMarks:    Joi.number().min(1).required(),
});

exports.bulkGradeSchema = Joi.object({
  courseId: Joi.string().hex().length(24).required(),
  semester: Joi.number().integer().min(1).max(8).required(),
  grades: Joi.array().items(
    Joi.object({
      studentId:    Joi.string().hex().length(24).required(),
      obtainedMarks: Joi.number().min(0).required(),
      totalMarks:    Joi.number().min(1).required(),
    })
  ).min(1).required(),
});
