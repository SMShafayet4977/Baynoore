const { pool } = require("../config/db");
const { createSlug } = require("../utils/createSlug");

async function getAllProducts(req, res) {
  try {
    const {
      search,
      category_id,
      status,
      is_featured,
      page = 1,
      limit = 20,
    } = req.query;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.product_code,
        p.regular_price,
        p.sale_price,
        p.status,
        p.is_featured,
        p.created_at,
        p.updated_at,
        c.name AS category_name,
        c.slug AS category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
        COALESCE(SUM(pv.stock_quantity), 0) AS stock_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += " AND (p.name LIKE ? OR p.product_code LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category_id) {
      query += " AND p.category_id = ?";
      params.push(category_id);
    }

    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    }

    if (is_featured !== undefined) {
      query += " AND p.is_featured = ?";
      params.push(is_featured === "true" || is_featured === true ? 1 : 0);
    }

    query += " GROUP BY p.id, c.name, c.slug";
    query += " ORDER BY p.created_at DESC";

    // Pagination
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await pool.query(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM products p WHERE 1=1";
    const countParams = [];

    if (search) {
      countQuery += " AND (p.name LIKE ? OR p.product_code LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (category_id) {
      countQuery += " AND p.category_id = ?";
      countParams.push(category_id);
    }

    if (status) {
      countQuery += " AND p.status = ?";
      countParams.push(status);
    }

    if (is_featured !== undefined) {
      countQuery += " AND p.is_featured = ?";
      countParams.push(is_featured === "true" || is_featured === true ? 1 : 0);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get products",
    });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      `SELECT 
        p.*,
        c.name AS category_name,
        c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = products[0];

    // Get images
    const [images] = await pool.query(
      `SELECT id, image_url, storage_provider, public_id, is_primary, sort_order
       FROM product_images
       WHERE product_id = ?
       ORDER BY is_primary DESC, sort_order ASC`,
      [id]
    );

    // Get variants
    const [variants] = await pool.query(
      `SELECT id, size, color, stock_quantity, sku, is_active
       FROM product_variants
       WHERE product_id = ?
       ORDER BY size, color`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...product,
        images,
        variants,
      },
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product",
    });
  }
}

async function createProduct(req, res) {
  try {
    const {
      category_id,
      name,
      product_code,
      short_description,
      full_description,
      fabric,
      care_instruction,
      regular_price,
      sale_price,
      status,
      is_featured,
    } = req.body;

    // Validation
    if (!category_id || !name || !product_code || !regular_price) {
      return res.status(400).json({
        success: false,
        message:
          "Category, name, product code, and regular price are required",
      });
    }

    if (regular_price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Regular price must be positive",
      });
    }

    if (sale_price && sale_price > regular_price) {
      return res.status(400).json({
        success: false,
        message: "Sale price cannot be greater than regular price",
      });
    }

    // Check if product code already exists
    const [existing] = await pool.query(
      "SELECT id FROM products WHERE product_code = ? LIMIT 1",
      [product_code]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists",
      });
    }

    // Generate slug
    const slug = createSlug(name, product_code);

    // Check if slug already exists
    const [existingSlug] = await pool.query(
      "SELECT id FROM products WHERE slug = ? LIMIT 1",
      [slug]
    );

    if (existingSlug.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Product with similar name and code already exists",
      });
    }

    // Create product
    const [result] = await pool.query(
      `INSERT INTO products 
       (category_id, name, slug, product_code, short_description, full_description, 
        fabric, care_instruction, regular_price, sale_price, status, is_featured, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id,
        name,
        slug,
        product_code,
        short_description || null,
        full_description || null,
        fabric || null,
        care_instruction || null,
        regular_price,
        sale_price || null,
        status || "draft",
        is_featured ? 1 : 0,
        req.admin.id,
      ]
    );

    const [newProduct] = await pool.query(
      "SELECT * FROM products WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct[0],
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      category_id,
      name,
      product_code,
      short_description,
      full_description,
      fabric,
      care_instruction,
      regular_price,
      sale_price,
      status,
      is_featured,
    } = req.body;

    // Check if product exists
    const [products] = await pool.query(
      "SELECT id, slug, product_code FROM products WHERE id = ? LIMIT 1",
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const currentProduct = products[0];

    // Validation
    if (regular_price && regular_price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Regular price must be positive",
      });
    }

    if (sale_price && regular_price && sale_price > regular_price) {
      return res.status(400).json({
        success: false,
        message: "Sale price cannot be greater than regular price",
      });
    }

    // Check if product code changed and is unique
    if (product_code && product_code !== currentProduct.product_code) {
      const [existing] = await pool.query(
        "SELECT id FROM products WHERE product_code = ? AND id != ? LIMIT 1",
        [product_code, id]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Product code already exists",
        });
      }
    }

    // Generate new slug if name or product_code changed
    let slug = currentProduct.slug;
    if (
      (name && name !== currentProduct.name) ||
      (product_code && product_code !== currentProduct.product_code)
    ) {
      slug = createSlug(
        name || currentProduct.name,
        product_code || currentProduct.product_code
      );

      // Check if new slug already exists
      const [existingSlug] = await pool.query(
        "SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1",
        [slug, id]
      );

      if (existingSlug.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Product with similar name and code already exists",
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (category_id) {
      updates.push("category_id = ?");
      params.push(category_id);
    }
    if (name) {
      updates.push("name = ?");
      params.push(name);
    }
    if (product_code) {
      updates.push("product_code = ?");
      params.push(product_code);
    }
    if (slug !== currentProduct.slug) {
      updates.push("slug = ?");
      params.push(slug);
    }
    if (short_description !== undefined) {
      updates.push("short_description = ?");
      params.push(short_description || null);
    }
    if (full_description !== undefined) {
      updates.push("full_description = ?");
      params.push(full_description || null);
    }
    if (fabric !== undefined) {
      updates.push("fabric = ?");
      params.push(fabric || null);
    }
    if (care_instruction !== undefined) {
      updates.push("care_instruction = ?");
      params.push(care_instruction || null);
    }
    if (regular_price) {
      updates.push("regular_price = ?");
      params.push(regular_price);
    }
    if (sale_price !== undefined) {
      updates.push("sale_price = ?");
      params.push(sale_price || null);
    }
    if (status) {
      updates.push("status = ?");
      params.push(status);
    }
    if (is_featured !== undefined) {
      updates.push("is_featured = ?");
      params.push(is_featured ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    params.push(id);

    await pool.query(
      `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    const [updatedProduct] = await pool.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct[0],
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    // Check if product exists
    const [products] = await pool.query(
      "SELECT id FROM products WHERE id = ? LIMIT 1",
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product exists in any orders
    const [orderItems] = await pool.query(
      "SELECT id FROM order_items WHERE product_id = ? LIMIT 1",
      [id]
    );

    if (orderItems.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete product that exists in orders. Consider marking it as out of stock instead.",
      });
    }

    // Delete product (cascades to images and variants)
    await pool.query("DELETE FROM products WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
