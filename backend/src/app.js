const express = require("express");
const cors = require("cors");
const path = require("path");
const metaRoutes = require("./routes/metaRoutes");
const authRoutes = require("./routes/authRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminProductRoutes = require("./routes/adminProductRoutes");
const productImageRoutes = require("./routes/productImageRoutes");
const productVariantRoutes = require("./routes/productVariantRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Baynoore API is running",
  });
});

app.use("/api", metaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/admins", adminUserRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin", productImageRoutes);
app.use("/api/admin", productVariantRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

module.exports = app;
