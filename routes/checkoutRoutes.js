const express = require("express");
const checkoutController = require("../controllers/checkoutController");
const { validateBody } = require("../middleware/validate");
const { checkoutSchema } = require("../validators/checkoutValidators");

const router = express.Router();

router.post("/", validateBody(checkoutSchema), checkoutController.createCheckout);

module.exports = router;
