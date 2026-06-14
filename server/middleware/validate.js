const Joi = require('joi');

/**
 * Joi validation middleware factory.
 * Usage: router.post('/route', validate(schema), handler)
 * Strips unknown fields and returns field-level errors on failure.
 */
module.exports = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return res.status(422).json({ message: 'Validation error', errors });
  }

  req.body = value;
  next();
};
