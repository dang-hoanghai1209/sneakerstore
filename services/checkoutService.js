const cartService = require("./cartService");
const { orders, orderItems } = require("../db/orders");

function checkout(cartId, shipping, note, paymentMethod) {
  const cart = cartService.getCart(cartId);
  if (!cart.items.length) {
    const error = new Error("Cart is empty");
    error.status = 400;
    throw error;
  }

  const totals = cartService.getTotals(cart);
  const orderId = `ord_${Date.now()}`;
  const paymentStatus = paymentMethod === "bank" ? "pending" : "unpaid";

  const order = {
    id: orderId,
    cart_id: cartId,
    shipping,
    note: note || "",
    payment_method: paymentMethod,
    amount: totals.total,
    status: "created",
    payment_status: paymentStatus,
    created_at: new Date().toISOString(),
  };

  orders.push(order);
  cart.items.forEach((item) => {
    orderItems.push({
      id: `${orderId}:${item.id}`,
      order_id: orderId,
      product_id: item.product_id,
      variant_id: item.variant_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      line_total: item.line_total,
      image_url: item.image_url,
    });
  });

  cartService.clearCart(cartId);
  return { order, totals };
}

module.exports = { checkout };
