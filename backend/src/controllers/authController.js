const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find admin by email
    const [admins] = await pool.query(
      `SELECT id, name, email, password_hash, role, is_active, approval_status, last_login_at
       FROM admin_users 
       WHERE email = ? LIMIT 1`,
      [email]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const admin = admins[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check approval status
    if (admin.approval_status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Your admin account is pending approval",
      });
    }

    if (admin.approval_status === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Your admin account request was rejected",
      });
    }

    // Check if active
    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your admin account is not active",
      });
    }

    // Update last login
    await pool.query(
      "UPDATE admin_users SET last_login_at = NOW() WHERE id = ?",
      [admin.id]
    );

    // Generate JWT
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
}

async function getMe(req, res) {
  try {
    const adminId = req.admin.id;

    const [admins] = await pool.query(
      `SELECT id, name, email, role, is_active, approval_status, last_login_at, created_at
       FROM admin_users 
       WHERE id = ? LIMIT 1`,
      [adminId]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      data: admins[0],
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get admin info",
    });
  }
}

async function adminSignup(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if email already exists
    const [existing] = await pool.query(
      "SELECT id FROM admin_users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create pending admin
    await pool.query(
      `INSERT INTO admin_users (name, email, password_hash, role, is_active, approval_status)
       VALUES (?, ?, ?, 'admin', false, 'pending')`,
      [name, email, passwordHash]
    );

    res.status(201).json({
      success: true,
      message:
        "Admin signup request submitted. Please wait for super admin approval.",
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    res.status(500).json({
      success: false,
      message: "Signup failed",
    });
  }
}

module.exports = {
  login,
  getMe,
  adminSignup,
};
