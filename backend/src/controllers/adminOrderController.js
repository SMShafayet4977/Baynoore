const { pool } = require("../config/db");
const { reduceStock, returnStock } = require("../utils/stockManager");

async function getAllOrders(req, res) {
  try {
    const {
      search,
      status,
      payment_status,
      district_id,
      date_from,
      date_to,
      page = 1,
      limit = 20,
    } = req.query;

    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.phone,
        o.total,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,
        d.name AS district_name
      FROM orders o
      LEFT JOIN districts d ON o.district_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += " AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += " AND o.order_status = ?";
      params.push(status);
    }

    if (payment_status) {
      query += " AND o.payment_status = ?";
      params.push(payment_status);
    }

    if (district_id) {
      query += " AND o.district_id = ?";
      params.push(district_id);
    }

    if (date_from) {
      query += " AND DATE(o.created_at) >= ?";
      params.push(date_from);
    }

    if (date_to) {
      query += " AND DATE(o.created_at) <= ?";
      params.push(date_to);
    }

    query += " ORDER BY o.created_at DESC";

    // Pagination
    const offset = (page - 1) * limit;
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await pool.query(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM orders o WHERE 1=1";
    const countParams = [];

    if (search) {
      countQuery += " AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.phone LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      countQuery += " AND o.order_status = ?";
      countParams.push(status);
    }

    if (payment_status) {
      countQuery += " AND o.payment_status = ?";
      countParams.push(payment_status);
    }

    if (district_id) {
      countQuery += " AND o.district_id = ?";
      countParams.push(district_id);
    }

    if (date_from) {
      countQuery += " AND DATE(o.created_at) >= ?";
      countParams.push(date_from);
    }

    if (date_to) {
      countQuery += " AND DATE(o.created_at) <= ?";
      countParams.push(date_to);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
    });
  }
}

async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    // Get order details
    const [orders] = await pool.query(
      `SELECT 
        o.*,
        d.name AS district_name,
        ca.name AS confirmed_by_name
       FROM orders o
       LEFT JOIN districts d ON o.district_id = d.id
       LEFT JOIN admin_users ca ON o.confirmed_by = ca.id
       WHERE o.id = ? LIMIT 1`,
      [id]
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
      `SELECT 
        oi.*
       FROM order_items oi
       WHERE oi.order_id = ?
       ORDER BY oi.id`,
      [id]
    );

    // Get status history
    const [statusHistory] = await pool.query(
      `SELECT 
        osh.*,
        au.name AS changed_by_name
       FROM order_status_history osh
       LEFT JOIN admin_users au ON osh.changed_by = au.id
       WHERE osh.order_id = ?
       ORDER BY osh.created_at DESC`,
      [id]
    );

    // Get manual payment if exists
    let manualPayment = null;
    if (order.payment_method === "manual_bkash") {
      const [payments] = await pool.query(
        `SELECT 
          mp.sender_number,
          mp.transaction_id,
          mp.amount,
          mp.screenshot_url,
          mp.verification_status,
          mp.verified_by,
          mp.verified_at,
          au.name AS verified_by_name
         FROM manual_payments mp
         LEFT JOIN admin_users au ON mp.verified_by = au.id
         WHERE mp.order_id = ? LIMIT 1`,
        [id]
      );

      if (payments.length > 0) {
        manualPayment = payments[0];
      }
    }

    res.json({
      success: true,
      data: {
        ...order,
        items,
        status_history: statusHistory,
        manual_payment: manualPayment,
      },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get order",
    });
  }
}

async function updateOrderStatus(req, res) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status, note } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];

    if (!allowedStatuses.includes(status)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    // Get current order
    const [orders] = await connection.query(
      "SELECT * FROM orders WHERE id = ? LIMIT 1",
      [id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orders[0];
    const oldStatus = order.order_status;

    // Handle stock logic
    if (status === "confirmed" && oldStatus !== "confirmed") {
      // Confirming order - reduce stock
      if (!order.stock_deducted) {
        try {
          await reduceStock(id, connection);
          
          // Update order
          await connection.query(
            `UPDATE orders 
             SET order_status = ?, stock_deducted = true, confirmed_by = ?, confirmed_at = NOW()
             WHERE id = ?`,
            [status, req.admin.id, id]
          );
        } catch (stockError) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: stockError.message,
          });
        }
      } else {
        // Already confirmed, just update status
        await connection.query(
          "UPDATE orders SET order_status = ? WHERE id = ?",
          [status, id]
        );
      }
    } else if (
      (status === "cancelled" || status === "returned") &&
      (oldStatus === "confirmed" || oldStatus === "processing" || oldStatus === "shipped")
    ) {
      // Cancelling/returning confirmed order - return stock
      if (order.stock_deducted) {
        await returnStock(id, connection);
        
        await connection.query(
          "UPDATE orders SET order_status = ?, stock_deducted = false WHERE id = ?",
          [status, id]
        );
      } else {
        // Stock not deducted, just update status
        await connection.query(
          "UPDATE orders SET order_status = ? WHERE id = ?",
          [status, id]
        );
      }
    } else {
      // Other status changes - no stock impact
      await connection.query(
        "UPDATE orders SET order_status = ? WHERE id = ?",
        [status, id]
      );
    }

    // Insert status history
    await connection.query(
      `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, note)
       VALUES (?, ?, ?, ?, ?)`,
      [id, oldStatus, status, req.admin.id, note || null]
    );

    await connection.commit();
    connection.release();

    // Get updated order
    const [updatedOrder] = await pool.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder[0],
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
}

async function updateOrderCourier(req, res) {
  try {
    const { id } = req.params;
    const { courier_name, courier_tracking_id } = req.body;

    // Check if order exists
    const [orders] = await pool.query(
      "SELECT id FROM orders WHERE id = ? LIMIT 1",
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update courier info
    await pool.query(
      "UPDATE orders SET courier_name = ?, courier_tracking_id = ? WHERE id = ?",
      [courier_name || null, courier_tracking_id || null, id]
    );

    const [updatedOrder] = await pool.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Courier information updated successfully",
      data: updatedOrder[0],
    });
  } catch (error) {
    console.error("Update courier error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update courier information",
    });
  }
}

async function updateOrderNote(req, res) {
  try {
    const { id } = req.params;
    const { admin_note } = req.body;

    // Check if order exists
    const [orders] = await pool.query(
      "SELECT id FROM orders WHERE id = ? LIMIT 1",
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update admin note
    await pool.query(
      "UPDATE orders SET admin_note = ? WHERE id = ?",
      [admin_note || null, id]
    );

    const [updatedOrder] = await pool.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Admin note updated successfully",
      data: updatedOrder[0],
    });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update admin note",
    });
  }
}

async function updateOrderPayment(req, res) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { payment_status } = req.body;

    const allowedPaymentStatuses = [
      "unpaid",
      "pending_verification",
      "paid",
      "failed",
    ];

    if (!allowedPaymentStatuses.includes(payment_status)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    // Check if order exists
    const [orders] = await connection.query(
      "SELECT * FROM orders WHERE id = ? LIMIT 1",
      [id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orders[0];

    // Update order payment status
    await connection.query(
      "UPDATE orders SET payment_status = ? WHERE id = ?",
      [payment_status, id]
    );

    // Update manual payment if exists
    if (order.payment_method === "manual_bkash") {
      const [manualPayments] = await connection.query(
        "SELECT id FROM manual_payments WHERE order_id = ? LIMIT 1",
        [id]
      );

      if (manualPayments.length > 0) {
        if (payment_status === "paid") {
          await connection.query(
            `UPDATE manual_payments 
             SET verification_status = 'verified', verified_by = ?, verified_at = NOW()
             WHERE order_id = ?`,
            [req.admin.id, id]
          );
        } else if (payment_status === "failed") {
          await connection.query(
            "UPDATE manual_payments SET verification_status = 'rejected' WHERE order_id = ?",
            [id]
          );
        } else if (payment_status === "pending_verification") {
          await connection.query(
            "UPDATE manual_payments SET verification_status = 'pending' WHERE order_id = ?",
            [id]
          );
        }
      }
    }

    await connection.commit();
    connection.release();

    const [updatedOrder] = await pool.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: updatedOrder[0],
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Update payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderCourier,
  updateOrderNote,
  updateOrderPayment,
};