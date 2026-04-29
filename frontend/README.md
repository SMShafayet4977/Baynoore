# Baynoore Frontend

Premium modest fashion e-commerce website for Bangladesh.

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS v4
- React Router v7
- Axios
- React Hook Form
- React Helmet Async (SEO)
- Zustand (cart state)
- Framer Motion
- Lucide React

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Available Scripts

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

## Routes

### Customer
- `/` — Homepage
- `/category/:slug` — Category page
- `/product/:slug` — Product details
- `/cart` — Shopping cart
- `/checkout` — Checkout
- `/order-success/:orderNumber` — Order confirmation
- `/track-order` — Track order
- `/exchange-policy` — Exchange policy
- `/search` — Search results

### Admin
- `/admin/login` — Admin login
- `/admin/signup` — Admin signup request
- `/admin/dashboard` — Dashboard
- `/admin/products` — Product management
- `/admin/products/new` — Create product
- `/admin/products/:id/edit` — Edit product
- `/admin/orders` — Order management
- `/admin/orders/:id` — Order details
- `/admin/admins` — Admin user management (super admin only)

## Notes

- No customer login — guest checkout only
- Admin login required for admin panel
- Manual bKash checkout requires screenshot upload
- Product images and payment screenshots stored on Cloudinary
- Cart persists in localStorage
