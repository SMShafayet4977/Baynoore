require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, testDatabaseConnection } = require("../config/db");

async function createSuperAdmin() {
  try {
    await testDatabaseConnection();

    const name = process.env.SUPER_ADMIN_NAME;
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "Missing SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, or SUPER_ADMIN_PASSWORD in .env"
      );
    }

    const [existingAdmins] = await pool.query(
      "SELECT id FROM admin_users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingAdmins.length > 0) {
      console.log("⚠️ Super admin already exists");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO admin_users (name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', true)`,
      [name, email, passwordHash]
    );

    console.log("✅ Super admin created successfully");
    console.log(`📧 Email: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create super admin:", error.message);
    process.exit(1);
  }
}

createSuperAdmin();
