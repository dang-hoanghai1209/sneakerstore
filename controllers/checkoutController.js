const checkoutService = require("../services/checkoutService");

function createCheckout(req, res) {
  try {
    const { cart_id: cartId, shipping, note, payment_method: paymentMethod } = req.body;
    const result = checkoutService.checkout(cartId, shipping, note, paymentMethod);
    return res.json({
      ok: true,
      data: {
        order_id: result.order.id,
        amount: result.order.amount,
        payment_status: result.order.payment_status,
      },
      error: null,
    });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ ok: false, data: null, error: { message: err.message } });
  }
}

module.exports = { createCheckout };
