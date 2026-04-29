-- Migration 003: Add admin approval columns to admin_users
-- Compatible with ALL MySQL versions (no IF NOT EXISTS)
-- Run each ALTER statement one at a time if needed

USE baynoore_db;

-- Step 1: Check which columns already exist
-- Run this SELECT first to see what's missing:
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'baynoore_db' 
  AND TABLE_NAME = 'admin_users'
  AND COLUMN_NAME IN ('approval_status', 'approved_by', 'approved_at', 'rejected_reason');

-- Step 2: Add columns one by one
-- Only run the ones that are NOT in the result above

ALTER TABLE admin_users 
ADD COLUMN approval_status ENUM('pending','approved','rejected') DEFAULT 'approved' AFTER is_active;

ALTER TABLE admin_users 
ADD COLUMN approved_by INT NULL AFTER approval_status;

ALTER TABLE admin_users 
ADD COLUMN approved_at DATETIME NULL AFTER approved_by;

ALTER TABLE admin_users 
ADD COLUMN rejected_reason TEXT NULL AFTER approved_at;

-- Step 3: Set existing super admin as approved
UPDATE admin_users 
SET approval_status = 'approved', is_active = TRUE 
WHERE role = 'super_admin';

-- Step 4: Verify
SELECT id, name, email, role, is_active, approval_status FROM admin_users;
