const { pool } = require("../config/db");
const { isCloudinaryConfigured } = require("../config/cloudinary");
const {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinaryUpload");

async function uploadProductImage(req, res) {
  try {
    const { productId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        success: false,
        message: "Image upload service is not configured",
      });
    }

    // Check if product exists
    const [products] = await pool.query(
      "SELECT id FROM products WHERE id = ? LIMIT 1",
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check image count
    const [imageCount] = await pool.query(
      "SELECT COUNT(*) as count FROM product_images WHERE product_id = ?",
      [productId]
    );

    if (imageCount[0].count >= 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 images allowed per product",
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "baynoore/products",
    });

    // Check if this is the first image
    const isPrimary = imageCount[0].count === 0;

    // Insert image
    const [result] = await pool.query(
      `INSERT INTO product_images (product_id, image_url, storage_provider, public_id, is_primary, sort_order)
       VALUES (?, ?, 'cloudinary', ?, ?, ?)`,
      [
        productId,
        uploadResult.secure_url,
        uploadResult.public_id,
        isPrimary ? 1 : 0,
        imageCount[0].count,
      ]
    );

    const [newImage] = await pool.query(
      "SELECT * FROM product_images WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Product image uploaded successfully",
      data: newImage[0],
    });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
}

async function deleteProductImage(req, res) {
  try {
    const { imageId } = req.params;

    // Get image info
    const [images] = await pool.query(
      "SELECT * FROM product_images WHERE id = ? LIMIT 1",
      [imageId]
    );

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const image = images[0];

    // Delete from Cloudinary if applicable
    if (image.storage_provider === "cloudinary" && image.public_id) {
      const deleteResult = await deleteFromCloudinary(image.public_id);
      
      if (!deleteResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete image from cloud storage. Please try again.",
        });
      }
    }

    // Delete from database
    await pool.query("DELETE FROM product_images WHERE id = ?", [imageId]);

    // If deleted image was primary, make another image primary
    if (image.is_primary) {
      const [otherImages] = await pool.query(
        "SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1",
        [image.product_id]
      );

      if (otherImages.length > 0) {
        await pool.query(
          "UPDATE product_images SET is_primary = true WHERE id = ?",
          [otherImages[0].id]
        );
      }
    }

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
    });
  }
}

async function setPrimaryImage(req, res) {
  try {
    const { imageId } = req.params;

    // Get image info
    const [images] = await pool.query(
      "SELECT * FROM product_images WHERE id = ? LIMIT 1",
      [imageId]
    );

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const image = images[0];

    // Unset all primary images for this product
    await pool.query(
      "UPDATE product_images SET is_primary = false WHERE product_id = ?",
      [image.product_id]
    );

    // Set this image as primary
    await pool.query("UPDATE product_images SET is_primary = true WHERE id = ?", [
      imageId,
    ]);

    res.json({
      success: true,
      message: "Primary image updated successfully",
    });
  } catch (error) {
    console.error("Set primary image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set primary image",
    });
  }
}

module.exports = {
  uploadProductImage,
  deleteProductImage,
  setPrimaryImage,
};
