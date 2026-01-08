const { randomUUID } = require("crypto");
const productsService = require("./productsService");

const carts = new Map();

function createCart() {
  const id = randomUUID();
  carts.set(id, { id, items: [] });
  return carts.get(id);
}

function getOrCreateCart(cartId) {
  if (!carts.has(cartId)) {
    carts.set(cartId, { id: cartId, items: [] });
  }
  return carts.get(cartId);
}

function getCart(cartId) {
  return getOrCreateCart(cartId);
}

function getTotals(cart) {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, total: subtotal, count };
}

function resolveItem(productId, variantId) {
  const product = productsService.getProductById(productId);
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  let variant = null;
  if (variantId) {
    variant = productsService.getVariantById(product, variantId);
    if (!variant) {
      const error = new Error("Variant not found");
      error.status = 404;
      throw error;
    }
  }

  return { product, variant };
}

function ensureStock({ product, variant }, desiredQty) {
  const stock = variant?.stock ?? product.stock;
  if (typeof stock === "number" && desiredQty > stock) {
    const error = new Error("Insufficient stock");
    error.status = 400;
    throw error;
  }
}

function addItem(cartId, payload) {
  const cart = getOrCreateCart(cartId);
  const { productId, qty } = payload;
  const variantId = payload.variantId || payload.variant_id;
  const quantity = qty;
  const { product, variant } = resolveItem(productId, variantId);
  const itemId = variantId ? `${productId}:${variantId}` : productId;
  const existing = cart.items.find((i) => i.id === itemId);
  const nextQty = (existing?.quantity || 0) + quantity;

  ensureStock({ product, variant }, nextQty);

  const price = Number(variant?.price ?? product.price ?? 0);
  const name = variant?.name ? `${product.name} - ${variant.name}` : product.name;
  const imageUrl = product.image_url || "";

  if (existing) {
    existing.quantity = nextQty;
    existing.price = price;
    existing.name = name;
    existing.image_url = imageUrl;
    existing.line_total = price * nextQty;
  } else {
    cart.items.push({
      id: itemId,
      product_id: productId,
      variant_id: variantId || null,
      name,
      price,
      quantity,
      line_total: price * quantity,
      image_url: imageUrl,
    });
  }

  return cart;
}

function updateItem(cartId, itemId, quantity) {
  const cart = getOrCreateCart(cartId);
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) return null;

  const { product, variant } = resolveItem(item.product_id, item.variant_id);
  ensureStock({ product, variant }, quantity);

  item.quantity = quantity;
  item.price = Number(variant?.price ?? product.price ?? item.price);
  item.line_total = item.price * quantity;
  return cart;
}

function removeItem(cartId, itemId) {
  const cart = getOrCreateCart(cartId);
  cart.items = cart.items.filter((i) => i.id !== itemId);
  return cart;
}

function clearCart(cartId) {
  const cart = getOrCreateCart(cartId);
  cart.items = [];
  return cart;
}

module.exports = {
  createCart,
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  getTotals,
};
