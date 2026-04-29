const { pool } = require("../config/db");

async function getAllProducts(req, res) {
  try {
    const {
      search,
      category,
      min_price,
      max_price,
      sort = "newest",
      page = 1,
      limit = 20,
    } = req.query;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.product_code,
        p.short_description,
        p.regular_price,
        p.sale_price,
        p.is_featured,
        p.created_at,
        c.name AS category_name,
        c.slug AS category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
        COALESCE(SUM(pv.stock_quantity), 0) AS stock_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
      WHERE p.status = 'active'
    `;
    const params = [];

    if (search) {
      query += " AND (p.name LIKE ? OR p.product_code LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += " AND c.slug = ?";
      params.push(category);
    }

    if (min_price) {
      query += " AND p.regular_price >= ?";
      params.push(min_price);
    }

    if (max_price) {
      query += " AND p.regular_price <= ?";
      params.push(max_price);
    }

    query += " GROUP BY p.id, c.name, c.slug";

    // Sorting
    if (sort === "price_low") {
      query += " ORDER BY p.regular_price ASC";
    } else if (sort === "price_high") {
      query += " ORDER BY p.regular_price DESC";
    } else {
      query += " ORDER BY p.created_at DESC";
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await pool.query(query, params);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get products",
    });
  }
}

async function getFeaturedProducts(req, res) {
  try {
    const [products] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.product_code,
        p.short_description,
        p.regular_price,
        p.sale_price,
        c.name AS category_name,
        c.slug AS category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
        COALESCE(SUM(pv.stock_quantity), 0) AS stock_quantity
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
       WHERE p.status = 'active' AND p.is_featured = true
       GROUP BY p.id, c.name, c.slug
       ORDER BY p.created_at DESC
       LIMIT 12`
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get featured products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get featured products",
    });
  }
}

async function getProductsByCategory(req, res) {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const [products] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.product_code,
        p.short_description,
        p.regular_price,
        p.sale_price,
        c.name AS category_name,
        c.slug AS category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS primary_image,
        COALESCE(SUM(pv.stock_quantity), 0) AS stock_quantity
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
       WHERE p.status = 'active' AND c.slug = ?
       GROUP BY p.id, c.name, c.slug
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [slug, parseInt(limit), (page - 1) * limit]
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get products",
    });
  }
}

async function getProductBySlug(req, res) {
  try {
    const { slug } = req.params;

    const [products] = await pool.query(
      `SELECT 
        p.*,
        c.name AS category_name,
        c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? AND p.status = 'active'
       LIMIT 1`,
      [slug]
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
      `SELECT id, image_url, is_primary, sort_order
       FROM product_images
       WHERE product_id = ?
       ORDER BY is_primary DESC, sort_order ASC`,
      [product.id]
    );

    // Get variants
    const [variants] = await pool.query(
      `SELECT id, size, color, stock_quantity, sku
       FROM product_variants
       WHERE product_id = ? AND is_active = true
       ORDER BY size, color`,
      [product.id]
    );

    // Get related products (same category)
    const [relatedProducts] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.slug,
        p.product_code,
        p.regular_price,
        p.sale_price,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS primary_image
       FROM products p
       WHERE p.category_id = ? AND p.id != ? AND p.status = 'active'
       ORDER BY RAND()
       LIMIT 4`,
      [product.category_id, product.id]
    );

    res.json({
      success: true,
      data: {
        ...product,
        images,
        variants,
        related_products: relatedProducts,
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

module.exports = {
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProductBySlug,
};
