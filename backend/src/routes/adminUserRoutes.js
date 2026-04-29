const express = require("express");
const {
  getAllAdmins,
  getPendingAdmins,
  createAdmin,
  approveAdmin,
  rejectAdmin,
  updateAdminStatus,
  updateAdminPassword,
} = require("../controllers/adminUserController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// All routes require super_admin role
router.use(authenticateToken);
router.use(allowRoles("super_admin"));

router.get("/", getAllAdmins);
router.get("/pending", getPendingAdmins);
router.post("/", createAdmin);
router.patch("/:id/approve", approveAdmin);
router.patch("/:id/reject", rejectAdmin);
router.patch("/:id/status", updateAdminStatus);
router.patch("/:id/password", updateAdminPassword);

module.exports = router;
