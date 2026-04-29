const { pool } = require("../config/db");
const { generateOrderNumber } = require("../utils/generateOrderNumber");
const { checkStock } = require("../utils/stockManager");
const { isCloudinaryConfigured } = require("../config/cloudinary");
const { uploadBufferToCloudinary } = require("../utils/cloudinaryUpload");

async function createOrder(req, res) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Support both camelCase and snake_case
    const {
      fullName,
      customer_name,
      phone,
      altPhone,
      alternative_phone,
      address,
      full_address,
      district,
      district_id,
      area,
      deliveryNote,
      delivery_note,
      paymentMethod,
      payment_method,
      bkashSenderNumber,
      bkashTransactionId,
      paidAmount,
      items,
    } = req.body;

    const customerName = fullName || customer_name;
    const customerPhone = phone;
    const alternativePhone = altPhone || alternative_phone;
    const fullAddress = address || full_address;
    const districtId = district_id;
    const customerArea = area;
    const note = deliveryNote || delivery_note;
    const method = paymentMethod || payment_method || "cod";

    // Validation
    if (!customerName || !customerPhone || !fullAddress || !customerArea) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Customer name, phone, address, and area are required",
      });
    }

    if (!items || items.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // Parse items if it's a string (from multipart/form-data)
    let orderItems = items;
    if (typeof items === "string") {
      try {
        orderItems = JSON.parse(items);
      } catch (e) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: "Invalid items format",
        });
      }
    }

    // Get district info
    let finalDistrictId = districtId;
    if (!finalDistrictId && district) {
      const [districts] = await connection.query(
        "SELECT id FROM districts WHERE name = ? OR slug = ? LIMIT 1",
        [district, district]
      );
      if (districts.length > 0) {
        finalDistrictId = districts[0].id;
      }
    }

    if (!finalDistrictId) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Valid district is required",
      });
    }

    // Get delivery charge
    const [districtInfo] = await connection.query(
      `SELECT d.id, d.name, z.delivery_charge
       FROM districts d
       JOIN delivery_zones z ON d.delivery_zone_id = z.id
       WHERE d.id = ? LIMIT 1`,
      [finalDistrictId]
    );

    if (districtInfo.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Invalid district",
      });
    }

    const deliveryCharge = districtInfo[0].delivery_charge;

    // Check stock availability
    try {
      await checkStock(orderItems);
    } catch (error) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Calculate totals
    let subtotal = 0;
    const itemsWithPrice = [];

    for (const item of orderItems) {
      const variantId = item.variantId || item.variant_id;
      const productId = item.productId || item.product_id;

      // Get product and variant info
      const [products] = await connection.query(
        `SELECT p.id, p.name, p.product_code, p.regular_price, p.sale_price
         FROM products p
         WHERE p.id = ? LIMIT 1`,
        [productId]
      );

      if (products.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Product ${productId} not found`,
        });
      }

      const product = products[0];
      const price = product.sale_price || product.regular_price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      itemsWithPrice.push({
        product_id: product.id,
        variant_id: variantId || null,
        product_name: product.name,
        product_code: product.product_code,
        size: item.size || null,
        color: item.color || null,
        quantity: item.quantity,
        price: price,
        total: itemTotal,
      });
    }

    const total = subtotal + parseFloat(deliveryCharge);

    // Handle manual bKash payment
    let paymentStatus = "unpaid";
    let screenshotUrl = null;
    let screenshotPublicId = null;

    if (method === "manual_bkash") {
      if (!bkashSenderNumber) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: "Sender bKash number is required",
        });
      }

      if (!bkashTransactionId) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required for manual bKash payment",
        });
      }

      if (!paidAmount) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: "Paid amount is required",
        });
      }

      if (!req.file) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: "Payment screenshot is required for manual bKash payment",
        });
      }

      // Check if Cloudinary is configured
      if (!isCloudinaryConfigured()) {
        await connection.rollback();
        connection.release();
        return res.status(500).json({
          success: false,
          message: "Payment upload service is not configured",
        });
      }

      // Upload screenshot to Cloudinary
      try {
        const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
          folder: "baynoore/payments",
        });
        screenshotUrl = uploadResult.secure_url;
        screenshotPublicId = uploadResult.public_id;
      } catch (uploadError) {
        await connection.rollback();
        connection.release();
        return res.status(500).json({
          success: false,
          message: "Failed to upload payment screenshot",
        });
      }

      paymentStatus = "pending_verification";
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders 
       (order_number, customer_name, phone, alternative_phone, district_id, area, 
        full_address, delivery_note, subtotal, delivery_charge, total, 
        payment_method, payment_status, order_status, stock_deducted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', false)`,
      [
        orderNumber,
        customerName,
        customerPhone,
        alternativePhone || null,
        finalDistrictId,
        customerArea,
        fullAddress,
        note || null,
        subtotal,
        deliveryCharge,
        total,
        method,
        paymentStatus,
      ]
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of itemsWithPrice) {
      await connection.query(
        `INSERT INTO order_items 
         (order_id, product_id, variant_id, product_name, product_code, size, color, quantity, price, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.variant_id,
          item.product_name,
          item.product_code,
          item.size,
          item.color,
          item.quantity,
          item.price,
          item.total,
        ]
      );
    }

    // Insert manual payment record if bKash
    if (method === "manual_bkash") {
      await connection.query(
        `INSERT INTO manual_payments 
         (order_id, payment_method, sender_number, transaction_id, amount, screenshot_url, screenshot_public_id, storage_provider, verification_status)
         VALUES (?, 'bkash', ?, ?, ?, ?, ?, 'cloudinary', 'pending')`,
        [orderId, bkashSenderNumber, bkashTransactionId, paidAmount, screenshotUrl, screenshotPublicId]
      );
    }

    await connection.commit();
    connection.release();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        order_number: orderNumber,
        total: total,
        payment_status: paymentStatus,
      },
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Create order error:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
}

async function trackOrder(req, res) {
  try {
    const { orderNumber } = req.params;

    const [orders] = await pool.query(
      `SELECT 
        o.order_number,
        o.customer_name,
        o.phone,
        o.district_id,
        o.area,
        o.total,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.courier_name,
        o.courier_tracking_id,
        o.created_at,
        d.name as district_name
       FROM orders o
       LEFT JOIN districts d ON o.district_id = d.id
       WHERE o.order_number = ? LIMIT 1`,
      [orderNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orders[0];

    // Get order items
    const [items] = await pool.query(
      `SELECT product_name, product_code, size, color, quantity, price, total
       FROM order_items
       WHERE order_id = (SELECT id FROM orders WHERE order_number = ? LIMIT 1)`,
      [orderNumber]
    );

    res.json({
      success: true,
      data: {
        ...order,
        items,
      },
    });
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track order",
    });
  }
}

module.exports = {
  createOrder,
  trackOrder,
};
