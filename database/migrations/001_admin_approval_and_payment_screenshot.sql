-- Migration: Add admin approval system and payment screenshot support
-- Run this after initial database setup

USE baynoore_db;

-- Add admin approval columns to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS approval_status ENUM('pending','approved','rejected') DEFAULT 'approved' AFTER is_active,
ADD COLUMN IF NOT EXISTS approved_by INT NULL AFTER approval_status,
ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL AFTER approved_by,
ADD COLUMN IF NOT EXISTS rejected_reason TEXT NULL AFTER approved_at;

-- Add foreign key for approved_by
-- ALTER TABLE admin_users ADD FOREIGN KEY (approved_by) REFERENCES admin_users(id);

-- Update existing super admin to be approved
UPDATE admin_users 
SET approval_status = 'approved', is_active = TRUE 
WHERE role = 'super_admin';

-- Add payment screenshot columns to manual_payments table
ALTER TABLE manual_payments
ADD COLUMN IF NOT EXISTS screenshot_url TEXT NULL AFTER amount,
ADD COLUMN IF NOT EXISTS screenshot_public_id VARCHAR(255) NULL AFTER screenshot_url,
ADD COLUMN IF NOT EXISTS storage_provider ENUM('local','cloudinary') DEFAULT 'local' AFTER screenshot_public_id;

-- Note: MySQL versions before 8.0.12 do not support IF NOT EXISTS in ALTER TABLE
-- If you get an error, check if columns already exist before running:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'baynoore_db' AND TABLE_NAME = 'admin_users';
