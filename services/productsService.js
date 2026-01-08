const { products } = require("../db/products");

function getProductById(productId) {
  return products.find((product) => product.id === productId);
}

function getVariantById(product, variantId) {
  if (!product || !Array.isArray(product.variants)) return null;
  return product.variants.find((variant) => variant.id === variantId);
}

function filterProducts(query) {
  const tag = (query.tag || "").toLowerCase();
  const category = (query.category || "").toLowerCase();
  const brand = (query.brand || "").toLowerCase();
  const size = (query.size || "").toLowerCase();
  const priceMinRaw = query.price_min;
  const priceMaxRaw = query.price_max;
  const priceMin = priceMinRaw === undefined || priceMinRaw === "" ? null : Number(priceMinRaw);
  const priceMax = priceMaxRaw === undefined || priceMaxRaw === "" ? null : Number(priceMaxRaw);

  let items = products.slice();
  if (tag === "new") items = items.filter((p) => p.is_new);
  if (tag === "best") items = items.filter((p) => p.is_best);
  if (tag === "sale") items = items.filter((p) => p.is_sale);
  if (category && category !== "all") items = items.filter((p) => p.category === category);
  if (brand) items = items.filter((p) => p.brand === brand);
  if (size) {
    items = items.filter((p) => Array.isArray(p.sizes) && p.sizes.includes(Number(size)));
  }
  if (priceMin !== null && !Number.isNaN(priceMin)) {
    items = items.filter((p) => Number(p.price || 0) >= priceMin);
  }
  if (priceMax !== null && !Number.isNaN(priceMax)) {
    items = items.filter((p) => Number(p.price || 0) <= priceMax);
  }

  return items;
}

module.exports = { filterProducts, getProductById, getVariantById };
