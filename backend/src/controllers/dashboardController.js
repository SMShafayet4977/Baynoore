const { pool } = require("../config/db");

async function getDashboardSummary(req, res) {
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Today's orders
    const [todayOrdersResult] = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?",
      [today]
    );
    const todayOrders = todayOrdersResult[0].count;

    // Orders by status
    const [statusCounts] = await pool.query(`
      SELECT 
        order_status,
        COUNT(*) as count
      FROM orders
      GROUP BY order_status
    `);

    const statusSummary = {
      pending_orders: 0,
      confirmed_orders: 0,
      processing_orders: 0,
      shipped_orders: 0,
      delivered_orders: 0,
      cancelled_orders: 0,
      returned_orders: 0,
    };

    statusCounts.forEach(row => {
      switch (row.order_status) {
        case 'pending':
          statusSummary.pending_orders = row.count;
          break;
        case 'confirmed':
          statusSummary.confirmed_orders = row.count;
          break;
        case 'processing':
          statusSummary.processing_orders = row.count;
          break;
        case 'shipped':
          statusSummary.shipped_orders = row.count;
          break;
        case 'delivered':
          statusSummary.delivered_orders = row.count;
          break;
        case 'cancelled':
          statusSummary.cancelled_orders = row.count;
          break;
        case 'returned':
          statusSummary.returned_orders = row.count;
          break;
      }
    });

    // Today's sales (delivered orders today)
    const [todaySalesResult] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as total_sales 
       FROM orders 
       WHERE DATE(created_at) = ? AND order_status = 'delivered'`,
      [today]
    );
    const todaySales = parseFloat(todaySalesResult[0].total_sales);

    // Total sales (all delivered orders)
    const [totalSalesResult] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as total_sales 
       FROM orders 
       WHERE order_status = 'delivered'`
    );
    const totalSales = parseFloat(totalSalesResult[0].total_sales);

    // Low stock products (stock <= 3 and active)
    const [lowStockResult] = await pool.query(`
      SELECT COUNT(DISTINCT pv.product_id) as count
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.stock_quantity <= 3 
        AND pv.is_active = true 
        AND p.status = 'active'
    `);
    const lowStockProducts = lowStockResult[0].count;

    // Recent orders (latest 10)
    const [recentOrders] = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.customer_name,
        o.total,
        o.order_status,
        o.payment_status,
        o.created_at,
        d.name as district_name
      FROM orders o
      LEFT JOIN districts d ON o.district_id = d.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        today_orders: todayOrders,
        ...statusSummary,
        today_sales: todaySales,
        total_sales: totalSales,
        low_stock_products: lowStockProducts,
        recent_orders: recentOrders,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard summary",
    });
  }
}

module.exports = {
  getDashboardSummary,
};