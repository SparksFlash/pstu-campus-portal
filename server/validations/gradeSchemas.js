const Joi = require('joi');

const marksFields = {
  obtainedMarks: Joi.number().min(0).max(100).required(),
  totalMarks:    Joi.number().min(1).max(100).required(),
};

exports.addGradeSchema = Joi.object({
  student:  Joi.string().hex().length(24).required(),
  course:   Joi.string().hex().length(24).required(),
  faculty:  Joi.string().hex().length(24).optional(),
  semester: Joi.number().integer().min(1).max(8).required(),
  teacher:  Joi.string().hex().length(24).optional(),
  ...marksFields,
});

exports.updateGradeSchema = Joi.object({
  ...marksFields,
});

exports.recordGradeSchema = Joi.object({
  student:  Joi.string().hex().length(24).required(),
  course:   Joi.string().hex().length(24).required(),
  semester: Joi.number().integer().min(1).max(8).required(),
  ...marksFields,
});

exports.bulkGradeSchema = Joi.object({
  courseId: Joi.string().hex().length(24).required(),
  semester: Joi.number().integer().min(1).max(8).required(),
  grades: Joi.array().items(
    Joi.object({
      studentId: Joi.string().hex().length(24).required(),
      ...marksFields,
    })
  ).min(1).required(),
});
