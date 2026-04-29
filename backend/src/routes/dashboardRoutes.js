const express = require("express");
const { getDashboardSummary } = require("../controllers/dashboardController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(allowRoles("super_admin", "admin"));

router.get("/summary", getDashboardSummary);

module.exports = router;