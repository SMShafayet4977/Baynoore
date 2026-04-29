-- Migration: Add Cloudinary support for payment screenshots
-- Run this migration to add screenshot columns to manual_payments table

USE baynoore_db;

-- Check if columns exist before adding them
-- You can check manually using:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'baynoore_db' AND TABLE_NAME = 'manual_payments';

-- Add screenshot columns to manual_payments table
-- Note: MySQL versions before 8.0.12 do not support IF NOT EXISTS in ALTER TABLE
-- If you get "Duplicate column name" error, the columns already exist and you can skip this

ALTER TABLE manual_payments
ADD COLUMN screenshot_url TEXT NULL AFTER amount,
ADD COLUMN screenshot_public_id VARCHAR(255) NULL AFTER screenshot_url,
ADD COLUMN storage_provider ENUM('local','cloudinary') DEFAULT 'cloudinary' AFTER screenshot_public_id;

-- Note: product_images table already has the necessary columns:
-- - storage_provider ENUM('local','cloudinary') DEFAULT 'local'
-- - public_id VARCHAR(255)
-- 
-- If you need to change the default for product_images to 'cloudinary', run:
-- ALTER TABLE product_images MODIFY storage_provider ENUM('local','cloudinary') DEFAULT 'cloudinary';

-- Verify the changes
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'baynoore_db' 
  AND TABLE_NAME = 'manual_payments'
  AND COLUMN_NAME IN ('screenshot_url', 'screenshot_public_id', 'storage_provider');
