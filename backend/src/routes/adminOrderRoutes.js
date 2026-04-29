const express = require("express");
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderCourier,
  updateOrderNote,
  updateOrderPayment,
} = require("../controllers/adminOrderController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(allowRoles("super_admin", "admin"));

router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/courier", updateOrderCourier);
router.patch("/:id/note", updateOrderNote);
router.patch("/:id/payment", updateOrderPayment);

module.exports = router;