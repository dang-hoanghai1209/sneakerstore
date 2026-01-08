const cartService = require("../services/cartService");

function createCart(req, res) {
  const cart = cartService.createCart();
  const totals = cartService.getTotals(cart);
  res.setHeader("x-cart-id", cart.id);
  return res.json({ ok: true, data: { cart, totals, cart_id: cart.id }, error: null });
}

function getCart(req, res) {
  const cartId = res.locals.cartId;
  const cart = cartService.getCart(cartId);
  const totals = cartService.getTotals(cart);
  return res.json({ ok: true, data: { cart, totals, cart_id: cartId }, error: null });
}

function addItem(req, res) {
  try {
    const cartId = res.locals.cartId;
    const cart = cartService.addItem(cartId, req.body);
    const totals = cartService.getTotals(cart);
    return res.json({ ok: true, data: { cart, totals, cart_id: cartId }, error: null });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ ok: false, data: null, error: { message: err.message } });
  }
}

function updateItem(req, res) {
  try {
    const cartId = res.locals.cartId;
    const itemId = req.params.itemId;
    const cart = cartService.updateItem(cartId, itemId, req.body.qty);
    if (!cart) {
      return res.status(404).json({ ok: false, data: null, error: { message: "Item not found" } });
    }
    const totals = cartService.getTotals(cart);
    return res.json({ ok: true, data: { cart, totals, cart_id: cartId }, error: null });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({ ok: false, data: null, error: { message: err.message } });
  }
}

function removeItem(req, res) {
  const cartId = res.locals.cartId;
  const itemId = req.params.itemId;
  const cart = cartService.removeItem(cartId, itemId);
  const totals = cartService.getTotals(cart);
  return res.json({ ok: true, data: { cart, totals, cart_id: cartId }, error: null });
}

function clearCart(req, res) {
  const cartId = res.locals.cartId;
  const cart = cartService.clearCart(cartId);
  const totals = cartService.getTotals(cart);
  return res.json({ ok: true, data: { cart, totals, cart_id: cartId }, error: null });
}

module.exports = { createCart, getCart, addItem, updateItem, removeItem, clearCart };
