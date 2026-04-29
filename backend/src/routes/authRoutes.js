const express = require("express");
const { login, getMe, adminSignup } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.post("/admin-signup", adminSignup);
router.get("/me", authenticateToken, getMe);

module.exports = router;
