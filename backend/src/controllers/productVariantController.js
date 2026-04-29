const { pool } = require("../config/db");

// Size validation by category
const CATEGORY_SIZES = {
  burka: ["50", "52", "54", "56"],
  punjabi: ["S", "M", "L", "XL", "XXL"],
  "one-piece": ["S", "M", "L", "XL", "XXL"],
  "two-piece": ["S", "M", "L", "XL", "XXL"],
  hijab: ["Free Size"],
};

async function createVariant(req, res) {
  try {
    const { productId } = req.params;
    const { size, color, stock_quantity, sku } = req.body;

    // Validation
    if (!size) {
      return res.status(400).json({
        success: false,
        message: "Size is required",
      });
    }

    if (stock_quantity !== undefined && stock_quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity cannot be negative",
      });
    }

    // Check if product exists and get category
    const [products] = await pool.query(
      `SELECT p.id, p.product_code, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? LIMIT 1`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = products[0];

    // Validate size based on category
    if (product.category_slug && CATEGORY_SIZES[product.category_slug]) {
      const validSizes = CATEGORY_SIZES[product.category_slug];
      if (!validSizes.includes(size)) {
        return res.status(400).json({
          success: false,
          message: `Invalid size for ${product.category_slug}. Valid sizes: ${validSizes.join(", ")}`,
        });
      }
    }

    // Check for duplicate variant
    const [existing] = await pool.query(
      `SELECT id FROM product_variants 
       WHERE product_id = ? AND size = ? AND color = ? LIMIT 1`,
      [productId, size, color || ""]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Variant with this size and color already exists",
      });
    }

    // Auto-generate SKU if not provided
    let variantSku = sku;
    if (!variantSku) {
      const colorSlug = color
        ? color.toLowerCase().replace(/\s+/g, "-")
        : "default";
      const sizeSlug = size.toLowerCase().replace(/\s+/g, "-");
      variantSku = `${product.product_code}-${sizeSlug}-${colorSlug}`;
    }

    // Create variant
    const [result] = await pool.query(
      `INSERT INTO product_variants (product_id, size, color, stock_quantity, sku, is_active)
       VALUES (?, ?, ?, ?, ?, true)`,
      [productId, size, color || null, stock_quantity || 0, variantSku]
    );

    const [newVariant] = await pool.query(
      "SELECT * FROM product_variants WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Variant created successfully",
      data: newVariant[0],
    });
  } catch (error) {
    console.error("Create variant error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create variant",
    });
  }
}

async function updateVariant(req, res) {
  try {
    const { variantId } = req.params;
    const { size, color, stock_quantity, sku, is_active } = req.body;

    // Check if variant exists
    const [variants] = await pool.query(
      `SELECT pv.*, p.product_code, c.slug as category_slug
       FROM product_variants pv
       LEFT JOIN products p ON pv.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE pv.id = ? LIMIT 1`,
      [variantId]
    );

    if (variants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    const variant = variants[0];

    // Validate size if changed
    if (size && size !== variant.size) {
      if (variant.category_slug && CATEGORY_SIZES[variant.category_slug]) {
        const validSizes = CATEGORY_SIZES[variant.category_slug];
        if (!validSizes.includes(size)) {
          return res.status(400).json({
            success: false,
            message: `Invalid size for ${variant.category_slug}. Valid sizes: ${validSizes.join(", ")}`,
          });
        }
      }

      // Check for duplicate
      const [existing] = await pool.query(
        `SELECT id FROM product_variants 
         WHERE product_id = ? AND size = ? AND color = ? AND id != ? LIMIT 1`,
        [variant.product_id, size, color || variant.color || "", variantId]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Variant with this size and color already exists",
        });
      }
    }

    if (stock_quantity !== undefined && stock_quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock quantity cannot be negative",
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (size) {
      updates.push("size = ?");
      params.push(size);
    }
    if (color !== undefined) {
      updates.push("color = ?");
      params.push(color || null);
    }
    if (stock_quantity !== undefined) {
      updates.push("stock_quantity = ?");
      params.push(stock_quantity);
    }
    if (sku) {
      updates.push("sku = ?");
      params.push(sku);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    params.push(variantId);

    await pool.query(
      `UPDATE product_variants SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    const [updatedVariant] = await pool.query(
      "SELECT * FROM product_variants WHERE id = ?",
      [variantId]
    );

    res.json({
      success: true,
      message: "Variant updated successfully",
      data: updatedVariant[0],
    });
  } catch (error) {
    console.error("Update variant error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update variant",
    });
  }
}

async function deleteVariant(req, res) {
  try {
    const { variantId } = req.params;

    // Check if variant exists
    const [variants] = await pool.query(
      "SELECT id FROM product_variants WHERE id = ? LIMIT 1",
      [variantId]
    );

    if (variants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    // Delete variant
    await pool.query("DELETE FROM product_variants WHERE id = ?", [variantId]);

    res.json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    console.error("Delete variant error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete variant",
    });
  }
}

module.exports = {
  createVariant,
  updateVariant,
  deleteVariant,
};
