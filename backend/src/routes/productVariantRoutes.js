const express = require("express");
const {
  createVariant,
  updateVariant,
  deleteVariant,
} = require("../controllers/productVariantController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(allowRoles("super_admin", "admin"));

router.post("/products/:productId/variants", createVariant);
router.patch("/variants/:variantId", updateVariant);
router.delete("/variants/:variantId", deleteVariant);

module.exports = router;
