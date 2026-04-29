CREATE DATABASE IF NOT EXISTS baynoore_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE baynoore_db;

CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role ENUM('super_admin','admin') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_zones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    delivery_charge DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    delivery_zone_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (delivery_zone_id) REFERENCES delivery_zones(id)
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    product_code VARCHAR(60) UNIQUE NOT NULL,
    short_description TEXT,
    full_description TEXT,
    fabric VARCHAR(150),
    care_instruction TEXT,
    regular_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    status ENUM('active','draft','out_of_stock') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (created_by) REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url TEXT NOT NULL,
    storage_provider ENUM('local','cloudinary') DEFAULT 'local',
    public_id VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size VARCHAR(50),
    color VARCHAR(80),
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(60) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    alternative_phone VARCHAR(30),
    district_id INT NOT NULL,
    area VARCHAR(150) NOT NULL,
    full_address TEXT NOT NULL,
    delivery_note TEXT,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_charge DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cod','manual_bkash') DEFAULT 'cod',
    payment_status ENUM('unpaid','pending_verification','paid','failed') DEFAULT 'unpaid',
    order_status ENUM('pending','confirmed','processing','shipped','delivered','cancelled','returned') DEFAULT 'pending',
    stock_deducted BOOLEAN DEFAULT FALSE,
    courier_name VARCHAR(100),
    courier_tracking_id VARCHAR(150),
    admin_note TEXT,
    confirmed_by INT NULL,
    confirmed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(id),
    FOREIGN KEY (confirmed_by) REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT,
    product_name VARCHAR(200) NOT NULL,
    product_code VARCHAR(60),
    size VARCHAR(50),
    color VARCHAR(80),
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS manual_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method ENUM('bkash') DEFAULT 'bkash',
    sender_number VARCHAR(30),
    transaction_id VARCHAR(100),
    amount DECIMAL(10,2),
    verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
    verified_by INT NULL,
    verified_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS site_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    policy_key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO delivery_zones (id, name, delivery_charge) VALUES
(1, 'Chattogram', 80),
(2, 'Outside Chattogram', 130);

INSERT IGNORE INTO categories (id, name, slug, sort_order) VALUES
(1, 'Burka', 'burka', 1),
(2, 'Hijab', 'hijab', 2),
(3, 'One Piece', 'one-piece', 3),
(4, 'Two Piece', 'two-piece', 4),
(5, 'Punjabi', 'punjabi', 5);

INSERT IGNORE INTO districts (name, slug, delivery_zone_id) VALUES
('Bagerhat', 'bagerhat', 2),
('Bandarban', 'bandarban', 2),
('Barguna', 'barguna', 2),
('Barishal', 'barishal', 2),
('Bhola', 'bhola', 2),
('Bogura', 'bogura', 2),
('Brahmanbaria', 'brahmanbaria', 2),
('Chandpur', 'chandpur', 2),
('Chapai Nawabganj', 'chapai-nawabganj', 2),
('Chattogram', 'chattogram', 1),
('Chuadanga', 'chuadanga', 2),
('Coxs Bazar', 'coxs-bazar', 2),
('Cumilla', 'cumilla', 2),
('Dhaka', 'dhaka', 2),
('Dinajpur', 'dinajpur', 2),
('Faridpur', 'faridpur', 2),
('Feni', 'feni', 2),
('Gaibandha', 'gaibandha', 2),
('Gazipur', 'gazipur', 2),
('Gopalganj', 'gopalganj', 2),
('Habiganj', 'habiganj', 2),
('Jamalpur', 'jamalpur', 2),
('Jashore', 'jashore', 2),
('Jhalokathi', 'jhalokathi', 2),
('Jhenaidah', 'jhenaidah', 2),
('Joypurhat', 'joypurhat', 2),
('Khagrachhari', 'khagrachhari', 2),
('Khulna', 'khulna', 2),
('Kishoreganj', 'kishoreganj', 2),
('Kurigram', 'kurigram', 2),
('Kushtia', 'kushtia', 2),
('Lakshmipur', 'lakshmipur', 2),
('Lalmonirhat', 'lalmonirhat', 2),
('Madaripur', 'madaripur', 2),
('Magura', 'magura', 2),
('Manikganj', 'manikganj', 2),
('Meherpur', 'meherpur', 2),
('Moulvibazar', 'moulvibazar', 2),
('Munshiganj', 'munshiganj', 2),
('Mymensingh', 'mymensingh', 2),
('Naogaon', 'naogaon', 2),
('Narail', 'narail', 2),
('Narayanganj', 'narayanganj', 2),
('Narsingdi', 'narsingdi', 2),
('Natore', 'natore', 2),
('Netrokona', 'netrokona', 2),
('Nilphamari', 'nilphamari', 2),
('Noakhali', 'noakhali', 2),
('Pabna', 'pabna', 2),
('Panchagarh', 'panchagarh', 2),
('Patuakhali', 'patuakhali', 2),
('Pirojpur', 'pirojpur', 2),
('Rajbari', 'rajbari', 2),
('Rajshahi', 'rajshahi', 2),
('Rangamati', 'rangamati', 2),
('Rangpur', 'rangpur', 2),
('Satkhira', 'satkhira', 2),
('Shariatpur', 'shariatpur', 2),
('Sherpur', 'sherpur', 2),
('Sirajganj', 'sirajganj', 2),
('Sunamganj', 'sunamganj', 2),
('Sylhet', 'sylhet', 2),
('Tangail', 'tangail', 2),
('Thakurgaon', 'thakurgaon', 2);

INSERT IGNORE INTO site_policies (policy_key, title, content) VALUES
('exchange_policy','Exchange Policy','We want you to love what you ordered. If the fit is not quite right, we are happy to help you with an exchange.

1. Exchange Window
You have 7 days from the date you receive your package to request an exchange. After 7 days, we unfortunately cannot offer an exchange.

2. Condition of Items
To be eligible for an exchange, your item must be in the same condition that you received it. Original tags must be attached. The item must be unwashed and unworn. No scents, perfume, cologne, stains, scratches, or damage to the fabric/material.

3. Shipping & Delivery Charges
Customers are responsible for the delivery charges for sending the new exchange item out.

4. Seasonal Final Sale
All purchases made during major festival shopping periods are final sale. We do not accept returns or exchanges for items bought during Eid-ul-Fitr, Eid-ul-Adha, Puja, Christmas, English New Year, or Bengali New Year.

5. How to Start an Exchange
Contact us with your order number and a photo of the item via WhatsApp: 01794529766. Email: baynoore@gmail.com, coming soon.');
