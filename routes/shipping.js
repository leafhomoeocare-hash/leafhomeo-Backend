const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const shippingController = require("../controller/shipping.controller");

// Shiprocket webhook endpoint - PUBLIC (no auth required)
router.post("/webhook", bodyParser.raw({ type: "application/json" }), (req, res, next) => {
  console.log('Shiprocket Webhook received - Body type:', typeof req.body);
  next();
}, shippingController.handleShiprocketWebhook);


module.exports = router;