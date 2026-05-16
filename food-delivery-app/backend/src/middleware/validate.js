function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (!error) return next();

    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
      },
    });
  };
}

module.exports = validate;
