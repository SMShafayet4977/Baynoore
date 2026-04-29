const express = require("express");
const {
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProductBySlug,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/category/:slug", getProductsByCategory);
router.get("/:slug", getProductBySlug);

module.exports = router;
