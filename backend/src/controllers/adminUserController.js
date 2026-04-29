const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

async function getAllAdmins(req, res) {
  try {
    const { approval_status, is_active, search } = req.query;

    let query = `
      SELECT id, name, email, role, is_active, approval_status, 
             approved_by, approved_at, rejected_reason, last_login_at, created_at
      FROM admin_users
      WHERE 1=1
    `;
    const params = [];

    if (approval_status) {
      query += " AND approval_status = ?";
      params.push(approval_status);
    }

    if (is_active !== undefined) {
      query += " AND is_active = ?";
      params.push(is_active === "true" || is_active === true ? 1 : 0);
    }

    if (search) {
      query += " AND (name LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY created_at DESC";

    const [admins] = await pool.query(query, params);

    res.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get admins",
    });
  }
}

async function getPendingAdmins(req, res) {
  try {
    const [admins] = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM admin_users
       WHERE approval_status = 'pending'
       ORDER BY created_at ASC`
    );

    res.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error("Get pending admins error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending admins",
    });
  }
}

async function createAdmin(req, res) {
  try {
    const { name, email, password, role } = req.body;

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

    const adminRole = role || "admin";
    if (!["admin", "super_admin"].includes(adminRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
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

    // Create approved admin
    const [result] = await pool.query(
      `INSERT INTO admin_users (name, email, password_hash, role, is_active, approval_status, approved_by, approved_at)
       VALUES (?, ?, ?, ?, true, 'approved', ?, NOW())`,
      [name, email, passwordHash, adminRole, req.admin.id]
    );

    const [newAdmin] = await pool.query(
      `SELECT id, name, email, role, is_active, approval_status, created_at
       FROM admin_users WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: newAdmin[0],
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin",
    });
  }
}

async function approveAdmin(req, res) {
  try {
    const { id } = req.params;

    // Check if admin exists
    const [admins] = await pool.query(
      "SELECT id, approval_status FROM admin_users WHERE id = ? LIMIT 1",
      [id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Approve admin
    await pool.query(
      `UPDATE admin_users 
       SET approval_status = 'approved', 
           is_active = true, 
           approved_by = ?, 
           approved_at = NOW(),
           rejected_reason = NULL
       WHERE id = ?`,
      [req.admin.id, id]
    );

    const [updatedAdmin] = await pool.query(
      `SELECT id, name, email, role, is_active, approval_status, approved_by, approved_at
       FROM admin_users WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Admin approved successfully",
      data: updatedAdmin[0],
    });
  } catch (error) {
    console.error("Approve admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve admin",
    });
  }
}

async function rejectAdmin(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if admin exists
    const [admins] = await pool.query(
      "SELECT id, role FROM admin_users WHERE id = ? LIMIT 1",
      [id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Don't allow rejecting super admin
    if (admins[0].role === "super_admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject super admin account",
      });
    }

    // Reject admin
    await pool.query(
      `UPDATE admin_users 
       SET approval_status = 'rejected', 
           is_active = false, 
           rejected_reason = ?
       WHERE id = ?`,
      [reason || null, id]
    );

    const [updatedAdmin] = await pool.query(
      `SELECT id, name, email, role, is_active, approval_status, rejected_reason
       FROM admin_users WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Admin rejected",
      data: updatedAdmin[0],
    });
  } catch (error) {
    console.error("Reject admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject admin",
    });
  }
}

async function updateAdminStatus(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: "is_active field is required",
      });
    }

    // Check if admin exists
    const [admins] = await pool.query(
      "SELECT id, role FROM admin_users WHERE id = ? LIMIT 1",
      [id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Don't allow super admin to deactivate themselves
    if (admins[0].id === req.admin.id && !is_active) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    // Update status
    await pool.query("UPDATE admin_users SET is_active = ? WHERE id = ?", [
      is_active ? 1 : 0,
      id,
    ]);

    const [updatedAdmin] = await pool.query(
      `SELECT id, name, email, role, is_active, approval_status
       FROM admin_users WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Admin status updated",
      data: updatedAdmin[0],
    });
  } catch (error) {
    console.error("Update admin status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update admin status",
    });
  }
}

async function updateAdminPassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if admin exists
    const [admins] = await pool.query(
      "SELECT id FROM admin_users WHERE id = ? LIMIT 1",
      [id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password
    await pool.query("UPDATE admin_users SET password_hash = ? WHERE id = ?", [
      passwordHash,
      id,
    ]);

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update password",
    });
  }
}

module.exports = {
  getAllAdmins,
  getPendingAdmins,
  createAdmin,
  approveAdmin,
  rejectAdmin,
  updateAdminStatus,
  updateAdminPassword,
};
