const express = require("express");
const {
  uploadProductImage,
  deleteProductImage,
  setPrimaryImage,
} = require("../controllers/productImageController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const { imageUpload } = require("../middleware/uploadMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(allowRoles("super_admin", "admin"));

// Upload image with multer middleware
router.post("/products/:productId/images", (req, res) => {
  imageUpload.single("image")(req, res, (err) => {
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
    uploadProductImage(req, res);
  });
});

router.delete("/product-images/:imageId", deleteProductImage);
router.patch("/product-images/:imageId/primary", setPrimaryImage);

module.exports = router;
