# Baynoore E-commerce Platform

Premium modest fashion e-commerce platform for Bangladesh with guest checkout, admin management, and manual bKash payment support.

## 🎯 Project Overview

**Brand:** Baynoore  
**Target Market:** Bangladesh only  
**Language:** English  
**Customer Login:** No (guest checkout only)  
**Admin System:** Yes (with approval workflow)  
**Payment Methods:** Cash on Delivery (COD) & Manual bKash  
**WhatsApp Support:** +8801794529766

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- MySQL (mysql2/promise)
- JWT Authentication
- Bcrypt password hashing
- Multer file uploads
- Slugify for URL-friendly slugs

### Frontend (To Be Implemented)
- React + Vite
- Tailwind CSS
- React Router
- Axios
- Zustand or Context API
- React Hook Form
- React Helmet Async (SEO)

## 📁 Project Structure

```
baynoore/
├── backend/              # Node.js Express API
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth, upload, role middleware
│   │   ├── routes/       # API routes
│   │   ├── uploads/      # Local file storage
│   │   │   ├── products/ # Product images
│   │   │   └── payments/ # Payment screenshots
│   │   ├── utils/        # Helper functions
│   │   ├── app.js        # Express app setup
│   │   └── server.js     # Server entry point
│   ├── .env              # Environment variables (not in Git)
│   ├── .env.example      # Environment template
│   └── package.json
├── database/
│   ├── init.sql          # Initial database setup
│   └── migrations/       # Database migrations
├── frontend/             # React app (to be implemented)
├── logo/                 # Brand assets
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### 1. Database Setup

```bash
# Create database and tables
# Open MySQL Workbench and run:
# 1. database/init.sql
# 2. database/migrations/001_admin_approval_and_payment_screenshot.sql
```

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MySQL credentials
# DB_USER=root
# DB_PASSWORD=your_password
# JWT_SECRET=your_long_random_secret

# Create super admin
npm run seed:admin

# Remove SUPER_ADMIN_PASSWORD from .env after seeding

# Start development server
npm run dev

# Backend runs on http://localhost:5000
```

### 3. Frontend Setup (To Be Implemented)

```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

### Public Endpoints

#### Meta Information
- `GET /` - API health check
- `GET /api/health` - Backend health status
- `GET /api/categories` - List all categories
- `GET /api/districts` - List all districts with delivery charges
- `GET /api/districts/:id/delivery-charge` - Get delivery charge for district
- `GET /api/policies/exchange` - Get exchange policy

#### Products
- `GET /api/products` - List active products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/category/:slug` - Products by category
- `GET /api/products/:slug` - Product details with images, variants, related products

#### Orders
- `POST /api/orders` - Create order (guest checkout)
- `GET /api/orders/track/:orderNumber` - Track order status

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/admin-signup` - Admin self-signup (creates pending account)
- `GET /api/auth/me` - Get current admin info (requires token)

### Admin Management (Super Admin Only)

- `GET /api/admin/admins` - List all admins
- `GET /api/admin/admins/pending` - List pending admin requests
- `POST /api/admin/admins` - Create approved admin
- `PATCH /api/admin/admins/:id/approve` - Approve pending admin
- `PATCH /api/admin/admins/:id/reject` - Reject admin request
- `PATCH /api/admin/admins/:id/status` - Activate/deactivate admin
- `PATCH /api/admin/admins/:id/password` - Update admin password

### Product Management (Admin + Super Admin)

- `GET /api/admin/products` - List products with filters
- `GET /api/admin/products/:id` - Get product details
- `POST /api/admin/products` - Create product
- `PATCH /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product (super admin only)

### Product Images (Admin + Super Admin)

- `POST /api/admin/products/:productId/images` - Upload image (max 5)
- `DELETE /api/admin/product-images/:imageId` - Delete image
- `PATCH /api/admin/product-images/:imageId/primary` - Set primary image

### Product Variants (Admin + Super Admin)

- `POST /api/admin/products/:productId/variants` - Create variant
- `PATCH /api/admin/variants/:variantId` - Update variant
- `DELETE /api/admin/variants/:variantId` - Delete variant

## 🔐 Authentication

All admin endpoints require JWT token in Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 💳 Payment Methods

### Cash on Delivery (COD)
- Default payment method
- No upfront payment required
- Payment collected on delivery

### Manual bKash
- Customer sends payment to: +8801794529766
- Required information:
  - Sender bKash number
  - Transaction ID
  - Paid amount
  - Payment screenshot (jpg, jpeg, png, webp, max 5MB)
- Admin verifies payment before confirming order

## 📦 Order Flow

1. **Customer places order** (guest checkout)
   - Stock is validated but NOT reduced
   - Order status: pending
   - Payment status: unpaid (COD) or pending_verification (bKash)

2. **Admin reviews order**
   - Verifies bKash payment if applicable
   - Confirms order

3. **Order confirmation**
   - Stock is reduced
   - stock_deducted flag set to true
   - Order status: confirmed

4. **Order fulfillment**
   - processing → shipped → delivered

5. **Cancellation/Return**
   - If order was confirmed, stock is returned
   - stock_deducted flag set to false

## 🎨 Product Categories & Sizes

### Burka
- Sizes: 50, 52, 54, 56

### Punjabi
- Sizes: S, M, L, XL, XXL

### One Piece
- Sizes: S, M, L, XL, XXL

### Two Piece
- Sizes: S, M, L, XL, XXL

### Hijab
- Size: Free Size

## 🚚 Delivery Charges

- **Chattogram:** ৳80
- **Outside Chattogram:** ৳130

## 📸 Product Images

- **Ratio:** 4:5 portrait
- **Recommended Resolution:** 2160px × 2700px
- **Max Images per Product:** 5
- **Allowed Formats:** jpg, jpeg, png, webp
- **Max File Size:** 5MB
- **Storage:** Local (development), Cloudinary (production - to be implemented)

## 🔒 Admin Roles

### Super Admin
- Full system access
- Manage admins (approve, reject, activate, deactivate)
- Delete products
- All admin capabilities

### Admin
- Manage products (create, edit)
- Upload images
- Manage variants
- Manage orders
- Cannot delete products
- Cannot manage other admins

## 🧪 Testing Checklist

### Authentication
- [ ] Super admin login
- [ ] Admin self-signup creates pending account
- [ ] Pending admin cannot login
- [ ] Super admin approves pending admin
- [ ] Approved admin can login
- [ ] Rejected admin cannot login
- [ ] Inactive admin cannot login
- [ ] Wrong password blocked
- [ ] Invalid token blocked

### Product Management
- [ ] Create product
- [ ] Edit product
- [ ] Delete product (super admin only)
- [ ] Normal admin cannot delete
- [ ] Upload image
- [ ] 6th image blocked
- [ ] Set primary image
- [ ] Delete image
- [ ] Create variant
- [ ] Duplicate variant blocked
- [ ] Invalid size blocked
- [ ] Update variant stock
- [ ] Delete variant

### Public Products
- [ ] Active products show
- [ ] Draft products hidden
- [ ] Product details load
- [ ] Related products show
- [ ] Featured products show
- [ ] Category filtering works
- [ ] Search works
- [ ] Price filtering works

### Orders
- [ ] COD order works
- [ ] Manual bKash order with screenshot works
- [ ] Manual bKash without screenshot blocked
- [ ] Manual bKash without transaction ID blocked
- [ ] Delivery charge calculated correctly
- [ ] Stock validated but not reduced
- [ ] Order tracking works
- [ ] Invalid district blocked
- [ ] Empty cart blocked

### Admin Order Management (To Be Implemented)
- [ ] List orders with filters
- [ ] View order details
- [ ] View bKash payment info
- [ ] Confirm order reduces stock
- [ ] Stock not reduced twice
- [ ] Cancel confirmed order returns stock
- [ ] Stock not returned twice
- [ ] Mark bKash paid
- [ ] Mark bKash failed
- [ ] Add courier tracking
- [ ] Add admin note
- [ ] Dashboard statistics

## 🐛 Known Issues & Limitations

1. **Frontend not implemented** - Needs complete React app
2. **Admin order management incomplete** - Stock reduction logic not implemented
3. **Dashboard not implemented** - Statistics and analytics needed
4. **Cloudinary integration pending** - Currently using local storage only
5. **Email notifications not implemented** - Order confirmations, admin approvals
6. **SMS notifications not implemented** - Order status updates
7. **Search optimization needed** - Full-text search for better performance
8. **Image optimization needed** - Resize and compress on upload
9. **Rate limiting not implemented** - API protection needed
10. **Logging not implemented** - Error tracking and monitoring needed

## 🔮 Future Enhancements

1. **Next.js Migration** - For better SEO and performance
2. **Cloudinary Integration** - Cloud-based image storage
3. **Email System** - Order confirmations, admin notifications
4. **SMS Integration** - Order status updates via SMS
5. **Advanced Analytics** - Sales reports, customer insights
6. **Inventory Alerts** - Low stock notifications
7. **Bulk Operations** - Import/export products
8. **Customer Accounts** - Optional customer login for order history
9. **Wishlist** - Save products for later
10. **Reviews & Ratings** - Customer feedback system
11. **Discount Codes** - Promotional campaigns
12. **Multi-currency** - Support for different currencies
13. **Multi-language** - Bengali language support

## 📞 Support

- **WhatsApp:** +8801794529766
- **Email:** safayet.hridoy75@gmail.com

## 📄 License

Private project for Baynoore.

---

**Current Status:** Backend ~60% complete, Frontend 0% complete

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed implementation status.
