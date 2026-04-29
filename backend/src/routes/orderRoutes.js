const express = require("express");
const { createOrder, trackOrder } = require("../controllers/orderController");
const { paymentScreenshotUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

// Create order with optional payment screenshot
router.post("/", (req, res) => {
  paymentScreenshotUpload.single("paymentScreenshot")(req, res, (err) => {
    if (err) {
      if (err.message.includes("File too large")) {
        return res.status(400).json({
          success: false,
          message: "Image size must be less than 5MB",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    createOrder(req, res);
  });
});

router.get("/track/:orderNumber", trackOrder);

module.exports = router;
