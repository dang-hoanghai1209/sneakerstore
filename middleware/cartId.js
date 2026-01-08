function requireCartId(req, res, next) {
  const paramId = req.params.cartId;
  const cartIdValue = paramId && String(paramId).trim() ? String(paramId).trim() : "";
  if (!cartIdValue) {
    return res.status(400).json({ ok: false, data: null, error: { message: "Missing cartId" } });
  }
  res.locals.cartId = cartIdValue;
  return next();
}

module.exports = { requireCartId };
