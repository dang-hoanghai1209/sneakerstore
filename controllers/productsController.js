const productsService = require("../services/productsService");

function listProducts(req, res) {
  const items = productsService.filterProducts(req.query || {});
  return res.json({ ok: true, data: { items, total: items.length }, error: null });
}

module.exports = { listProducts };
