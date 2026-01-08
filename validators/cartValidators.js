const { z } = require("zod");

const addItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1),
});

const updateItemSchema = z.object({
  qty: z.number().int().min(1),
});

module.exports = { addItemSchema, updateItemSchema };
