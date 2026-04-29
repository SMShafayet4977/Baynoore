const express = require("express");
const { pool } = require("../config/db");
const router = express.Router();

router.get("/health", async (req, res) => {
  res.json({
    success: true,
    message: "Baynoore backend is healthy",
  });
});

router.get("/categories", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, slug, image_url, sort_order FROM categories WHERE is_active = true ORDER BY sort_order ASC"
  );
  res.json({
    success: true,
    data: rows,
  });
});

router.get("/districts", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT 
      d.id,
      d.name,
      d.slug,
      z.name AS delivery_zone,
      z.delivery_charge
    FROM districts d
    JOIN delivery_zones z ON d.delivery_zone_id = z.id
    WHERE d.is_active = true
    ORDER BY d.name ASC
  `);
  res.json({
    success: true,
    data: rows,
  });
});

router.get("/districts/:id/delivery-charge", async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    `
    SELECT 
      d.id,
      d.name,
      z.delivery_charge
    FROM districts d
    JOIN delivery_zones z ON d.delivery_zone_id = z.id
    WHERE d.id = ? AND d.is_active = true
    LIMIT 1
  `,
    [id]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "District not found",
    });
  }

  res.json({
    success: true,
    data: rows[0],
  });
});

router.get("/policies/exchange", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT title, content FROM site_policies WHERE policy_key = 'exchange_policy' AND is_active = true LIMIT 1"
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Exchange policy not found",
    });
  }

  res.json({
    success: true,
    data: rows[0],
  });
});

module.exports = router;
