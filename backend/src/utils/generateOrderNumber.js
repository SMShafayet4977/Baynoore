const { pool } = require("../config/db");

async function generateOrderNumber() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const datePrefix = `${year}${month}${day}`;

  // Get today's order count
  const [orders] = await pool.query(
    `SELECT COUNT(*) as count FROM orders 
     WHERE DATE(created_at) = CURDATE()`
  );

  const orderCount = orders[0].count + 1;
  const orderNumber = `BN-${datePrefix}-${String(orderCount).padStart(4, "0")}`;

  return orderNumber;
}

module.exports = { generateOrderNumber };
