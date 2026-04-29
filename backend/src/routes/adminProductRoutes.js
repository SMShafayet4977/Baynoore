const express = require("express");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/adminProductController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET/POST/PATCH: super_admin and admin
router.get("/", allowRoles("super_admin", "admin"), getAllProducts);
router.get("/:id", allowRoles("super_admin", "admin"), getProductById);
router.post("/", allowRoles("super_admin", "admin"), createProduct);
router.patch("/:id", allowRoles("super_admin", "admin"), updateProduct);

// DELETE: super_admin only
router.delete("/:id", allowRoles("super_admin"), deleteProduct);

module.exports = router;
