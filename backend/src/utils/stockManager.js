const { pool } = require("../config/db");

async function reduceStock(orderId, connection) {
  const conn = connection || pool;

  // Get order items
  const [items] = await conn.query(
    "SELECT variant_id, quantity FROM order_items WHERE order_id = ?",
    [orderId]
  );

  // Check stock availability first (within the same transaction)
  for (const item of items) {
    if (item.variant_id) {
      const [variants] = await conn.query(
        "SELECT stock_quantity FROM product_variants WHERE id = ? AND is_active = true LIMIT 1",
        [item.variant_id]
      );

      if (variants.length === 0) {
        throw new Error(`Variant ID ${item.variant_id} not found or inactive`);
      }

      if (variants[0].stock_quantity < item.quantity) {
        throw new Error(
          `Insufficient stock. Available: ${variants[0].stock_quantity}, Required: ${item.quantity}`
        );
      }
    }
  }

  // Reduce stock for each variant
  for (const item of items) {
    if (item.variant_id) {
      await conn.query(
        "UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?",
        [item.quantity, item.variant_id]
      );
    }
  }
}

async function returnStock(orderId, connection) {
  const conn = connection || pool;

  // Get order items
  const [items] = await conn.query(
    "SELECT variant_id, quantity FROM order_items WHERE order_id = ?",
    [orderId]
  );

  // Return stock for each variant
  for (const item of items) {
    if (item.variant_id) {
      await conn.query(
        "UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?",
        [item.quantity, item.variant_id]
      );
    }
  }
}

async function checkStock(items) {
  for (const item of items) {
    if (item.variantId || item.variant_id) {
      const variantId = item.variantId || item.variant_id;
      const [variants] = await pool.query(
        "SELECT stock_quantity FROM product_variants WHERE id = ? AND is_active = true LIMIT 1",
        [variantId]
      );

      if (variants.length === 0) {
        throw new Error(`Variant ${variantId} not found or inactive`);
      }

      if (variants[0].stock_quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for variant ${variantId}. Available: ${variants[0].stock_quantity}, Requested: ${item.quantity}`
        );
      }
    }
  }
}

module.exports = {
  reduceStock,
  returnStock,
  checkStock,
};
