function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        data: null,
        error: {
          message: "Validation failed",
          details: result.error.issues,
        },
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
