const express = require("express");
const cartController = require("../controllers/cartController");
const { requireCartId } = require("../middleware/cartId");
const { validateBody } = require("../middleware/validate");
const { addItemSchema, updateItemSchema } = require("../validators/cartValidators");

const router = express.Router();

router.post("/", cartController.createCart);
router.get("/:cartId", requireCartId, cartController.getCart);
router.post("/:cartId/items", requireCartId, validateBody(addItemSchema), cartController.addItem);
router.patch("/:cartId/items/:itemId", requireCartId, validateBody(updateItemSchema), cartController.updateItem);
router.delete("/:cartId/items/:itemId", requireCartId, cartController.removeItem);
router.delete("/:cartId", requireCartId, cartController.clearCart);

module.exports = router;
