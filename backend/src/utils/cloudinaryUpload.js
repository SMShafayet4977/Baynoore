const { cloudinary } = require("../config/cloudinary");
const streamifier = require("streamifier");

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder path
 * @param {string} options.resource_type - Resource type (default: 'image')
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
async function uploadBufferToCloudinary(fileBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || "baynoore",
      resource_type: options.resource_type || "image",
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function deleteFromCloudinary(publicId) {
  try {
    if (!publicId) {
      return {
        success: false,
        message: "Public ID is required",
      };
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok" || result.result === "not found") {
      return {
        success: true,
        message: "File deleted successfully",
      };
    }

    return {
      success: false,
      message: "Failed to delete file from Cloudinary",
    };
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete file",
    };
  }
}

module.exports = {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
