# Baynoore E-commerce Backend

## Phase 1: Database + Backend Starter ✅ COMPLETED

### What's Been Set Up

1. **Database Structure** (`database/init.sql`)
   - MySQL database with all tables created
   - Categories: Burka, Hijab, One Piece, Two Piece, Punjabi
   - Delivery zones: Chattogram (৳80), Outside Chattogram (৳130)
   - All 64 districts of Bangladesh
   - Exchange policy content

2. **Backend Project Structure**
   ```
   backend/
   ├── src/
   │   ├── config/
   │   │   └── db.js              # MySQL connection pool
   │   ├── controllers/           # (Ready for next phase)
   │   ├── middleware/            # (Ready for next phase)
   │   ├── routes/
   │   │   └── metaRoutes.js      # Public API routes
   │   ├── uploads/               # Product images storage
   │   ├── utils/
   │   │   └── createSuperAdmin.js # Super admin seed script
   │   ├── app.js                 # Express app configuration
   │   └── server.js              # Server entry point
   ├── .env                       # Environment variables
   ├── .gitignore                 # Git ignore rules
   └── package.json               # Dependencies & scripts
   ```

3. **Dependencies Installed**
   - express (v5.2.1)
   - mysql2 (v3.22.3)
   - dotenv (v17.4.2)
   - cors (v2.8.6)
   - bcryptjs (v3.0.3)
   - jsonwebtoken (v9.0.3)
   - multer (v2.1.1)
   - slugify (v1.6.9)
   - nodemon (v3.1.14) - dev only

### API Endpoints Working

✅ **GET /** - API health check
✅ **GET /api/health** - Backend health status
✅ **GET /api/categories** - List all active categories
✅ **GET /api/districts** - List all districts with delivery charges
✅ **GET /api/districts/:id/delivery-charge** - Get delivery charge for specific district
✅ **GET /api/policies/exchange** - Get exchange policy

### Super Admin Created

- **Email:** safayet.hridoy75@gmail.com
- **Password:** Set during initial seed via `npm run seed:admin` (stored securely with bcrypt)
- **Role:** super_admin

> ⚠️ Never store real passwords in documentation or version control.

### How to Run

```bash
# Start development server
npm run dev

# Start production server
npm start

# Create super admin (already done)
npm run seed:admin
```

### Test URLs

- http://localhost:5000
- http://localhost:5000/api/health
- http://localhost:5000/api/categories
- http://localhost:5000/api/districts
- http://localhost:5000/api/districts/10/delivery-charge
- http://localhost:5000/api/policies/exchange

### Security Notes

✅ SUPER_ADMIN_PASSWORD removed from .env after seeding
✅ .gitignore configured to exclude .env, node_modules, and uploads
✅ Passwords hashed with bcryptjs (12 rounds)

---

## Next Phase: Admin Login + JWT

Ready to implement:
- POST /api/auth/login
- GET /api/auth/me
- Admin authentication middleware
- Super admin role protection

After authentication is complete, we can build:
- Product CRUD operations
- Product image upload (local + Cloudinary support)
- Product variants (size, color, stock)
- Order management system
- Stock confirmation logic
