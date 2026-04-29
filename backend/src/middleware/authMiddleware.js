const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify admin still exists and is active
    const [admins] = await pool.query(
      `SELECT id, name, email, role, is_active, approval_status
       FROM admin_users 
       WHERE id = ? LIMIT 1`,
      [decoded.id]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const admin = admins[0];

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your admin account is not active",
      });
    }

    if (admin.approval_status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your admin account is not approved",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
}

module.exports = { authenticateToken };
