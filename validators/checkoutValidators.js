const { z } = require("zod");

const checkoutSchema = z.object({
  cart_id: z.string().min(1),
  shipping: z.object({
    name: z.string().min(1),
    phone: z.string().min(6),
    address: z.string().min(3),
  }),
  note: z.string().optional(),
  payment_method: z.enum(["COD", "bank"]),
});

module.exports = { checkoutSchema };
