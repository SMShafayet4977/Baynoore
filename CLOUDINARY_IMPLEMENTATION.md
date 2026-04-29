# Cloudinary Integration Implementation

## ✅ Completed Changes

### 1. Packages Installed
- `cloudinary` - Cloudinary SDK for Node.js
- `streamifier` - Convert buffer to stream for Cloudinary upload

### 2. Files Created

#### Configuration
- **`backend/src/config/cloudinary.js`**
  - Cloudinary configuration using environment variables
  - `isCloudinaryConfigured()` function to check if all credentials are set

#### Utilities
- **`backend/src/utils/cloudinaryUpload.js`**
  - `uploadBufferToCloudinary(fileBuffer, options)` - Upload buffer to Cloudinary
  - `deleteFromCloudinary(publicId)` - Delete file from Cloudinary
  - Folders: `baynoore/products` and `baynoore/payments`

#### Database Migration
- **`database/migrations/002_cloudinary_uploads.sql`**
  - Adds `screenshot_url`, `screenshot_public_id`, `storage_provider` to `manual_payments` table
  - Note: `product_images` table already has necessary columns

### 3. Files Modified

#### Middleware
- **`backend/src/middleware/uploadMiddleware.js`**
  - Changed from disk storage to memory storage
  - Renamed exports: `imageUpload` and `paymentScreenshotUpload`
  - Improved file type validation with clear error messages
  - File size limit: 5MB with clear error message

#### Controllers
- **`backend/src/controllers/productImageController.js`**
  - Upload images to Cloudinary folder: `baynoore/products`
  - Store `secure_url`, `public_id`, and `storage_provider = 'cloudinary'`
  - Delete from Cloudinary before deleting from database
  - Fail-safe: If Cloudinary delete fails, don't delete DB row

- **`backend/src/controllers/orderController.js`**
  - Upload payment screenshots to Cloudinary folder: `baynoore/payments`
  - Store `screenshot_url`, `screenshot_public_id`, and `storage_provider = 'cloudinary'`
  - Support both JSON (COD) and multipart/form-data (manual bKash)
  - Parse items as JSON string when received via multipart

#### Routes
- **`backend/src/routes/productImageRoutes.js`**
  - Updated to use new `imageUpload` middleware
  - Better error handling for file size and type

- **`backend/src/routes/orderRoutes.js`**
  - Updated to use new `paymentScreenshotUpload` middleware
  - Better error handling for file size and type

#### Environment
- **`backend/.env.example`**
  - Added Cloudinary configuration variables

---

## 🔑 Environment Variables Required

Add these to your `backend/.env` file:

```env
# Cloudinary Configuration (Required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**How to get Cloudinary credentials:**
1. Sign up at https://cloudinary.com (free tier available)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Add them to your `.env` file

**Important:** Never commit `.env` file to Git. Cloudinary secrets should never be exposed to frontend.

---

## 📋 Database Migration

Run this migration to add screenshot columns to `manual_payments` table:

```bash
# In MySQL Workbench or MySQL CLI:
source database/migrations/002_cloudinary_uploads.sql
```

Or manually run:

```sql
USE baynoore_db;

ALTER TABLE manual_payments
ADD COLUMN screenshot_url TEXT NULL AFTER amount,
ADD COLUMN screenshot_public_id VARCHAR(255) NULL AFTER screenshot_url,
ADD COLUMN storage_provider ENUM('local','cloudinary') DEFAULT 'cloudinary' AFTER screenshot_public_id;
```

**Note:** If you get "Duplicate column name" error, the columns already exist and you can skip this step.

---

## 🧪 Testing Guide

### Test 1: Product Image Upload

**Endpoint:** `POST /api/admin/products/:productId/images`

**Prerequisites:**
1. Login as admin to get JWT token
2. Have a product created (get productId)
3. Have Cloudinary credentials in `.env`

**Test with Postman/Thunder Client:**

```
POST http://localhost:5000/api/admin/products/1/images
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Body (form-data):
- image: [select image file - jpg, jpeg, png, or webp, max 5MB]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Product image uploaded successfully",
  "data": {
    "id": 1,
    "product_id": 1,
    "image_url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/baynoore/products/abc123.jpg",
    "storage_provider": "cloudinary",
    "public_id": "baynoore/products/abc123",
    "is_primary": true,
    "sort_order": 0,
    "created_at": "2026-04-29T..."
  }
}
```

**Verify:**
1. Check database: `storage_provider` should be `'cloudinary'`
2. Check database: `public_id` should be populated
3. Check database: `image_url` should be Cloudinary URL (starts with `https://res.cloudinary.com`)
4. Visit the `image_url` in browser - image should load from Cloudinary
5. Check Cloudinary dashboard - image should appear in `baynoore/products` folder

**Test Error Cases:**

1. **Wrong file type:**
```
Upload a .txt or .pdf file
Expected: 400 "Only JPG, JPEG, PNG, and WEBP images are allowed"
```

2. **File too large:**
```
Upload an image > 5MB
Expected: 400 "Image size must be less than 5MB"
```

3. **6th image:**
```
Upload 6 images to same product
Expected: 400 "Maximum 5 images allowed per product"
```

4. **Missing Cloudinary config:**
```
Remove Cloudinary env variables and restart server
Expected: 500 "Image upload service is not configured"
```

---

### Test 2: Product Image Delete

**Endpoint:** `DELETE /api/admin/product-images/:imageId`

**Test with Postman:**

```
DELETE http://localhost:5000/api/admin/product-images/1
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Verify:**
1. Check database: Image row should be deleted
2. Check Cloudinary dashboard: Image should be deleted from `baynoore/products` folder
3. Try visiting the old `image_url` - should return 404 or "Resource not found"

---

### Test 3: COD Order (JSON)

**Endpoint:** `POST /api/orders`

**Test with Postman:**

```
POST http://localhost:5000/api/orders
Content-Type: application/json

Body (JSON):
{
  "fullName": "Test Customer",
  "phone": "01712345678",
  "address": "123 Main Street, Dhaka",
  "district_id": 14,
  "area": "Dhanmondi",
  "paymentMethod": "cod",
  "items": [
    {
      "productId": 1,
      "variantId": 1,
      "size": "M",
      "color": "Black",
      "quantity": 1
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order_number": "BN-20260429-0001",
    "total": 2580,
    "payment_status": "unpaid"
  }
}
```

**Verify:**
1. Order created in database
2. No manual_payments record (COD doesn't need it)
3. `payment_status` = 'unpaid'
4. `order_status` = 'pending'

---

### Test 4: Manual bKash Order with Screenshot

**Endpoint:** `POST /api/orders`

**Test with Postman:**

```
POST http://localhost:5000/api/orders
Content-Type: multipart/form-data

Body (form-data):
- fullName: Test Customer
- phone: 01712345678
- address: 123 Main Street, Dhaka
- district_id: 14
- area: Dhanmondi
- paymentMethod: manual_bkash
- bkashSenderNumber: 01798765432
- bkashTransactionId: ABC123XYZ456
- paidAmount: 2580
- paymentScreenshot: [select image file]
- items: [{"productId":1,"variantId":1,"size":"M","color":"Black","quantity":1}]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order_number": "BN-20260429-0002",
    "total": 2580,
    "payment_status": "pending_verification"
  }
}
```

**Verify:**
1. Order created in database
2. manual_payments record created with:
   - `screenshot_url` = Cloudinary URL
   - `screenshot_public_id` = Cloudinary public_id
   - `storage_provider` = 'cloudinary'
   - `verification_status` = 'pending'
3. `payment_status` = 'pending_verification'
4. Check Cloudinary dashboard - screenshot should appear in `baynoore/payments` folder
5. Visit `screenshot_url` in browser - image should load

**Test Error Cases:**

1. **Missing screenshot:**
```
Don't include paymentScreenshot field
Expected: 400 "Payment screenshot is required for manual bKash payment"
```

2. **Missing transaction ID:**
```
Don't include bkashTransactionId
Expected: 400 "Transaction ID is required for manual bKash payment"
```

3. **Missing sender number:**
```
Don't include bkashSenderNumber
Expected: 400 "Sender bKash number is required"
```

4. **Missing paid amount:**
```
Don't include paidAmount
Expected: 400 "Paid amount is required"
```

---

### Test 5: Order Tracking (Public)

**Endpoint:** `GET /api/orders/track/:orderNumber`

**Test with Postman:**

```
GET http://localhost:5000/api/orders/track/BN-20260429-0001
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "order_number": "BN-20260429-0001",
    "customer_name": "Test Customer",
    "phone": "01712345678",
    "district_id": 14,
    "area": "Dhanmondi",
    "total": 2580,
    "payment_method": "cod",
    "payment_status": "unpaid",
    "order_status": "pending",
    "courier_name": null,
    "courier_tracking_id": null,
    "created_at": "2026-04-29T...",
    "district_name": "Dhaka",
    "items": [...]
  }
}
```

**Important:** Public tracking should NOT expose:
- `screenshot_url`
- `screenshot_public_id`
- Admin notes
- Internal order details

Only show: order status, payment status, courier info, items

---

## 🎨 Frontend Implementation Guide

### Admin Product Image Upload

```javascript
// In admin product image uploader component

const handleImageUpload = async (productId, imageFile) => {
  try {
    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      alert('Only JPG, JPEG, PNG, and WEBP images are allowed');
      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('image', imageFile);

    // Upload
    const response = await axios.post(
      `/api/admin/products/${productId}/images`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let axios set it with boundary
        }
      }
    );

    if (response.data.success) {
      // Show success message
      alert('Image uploaded successfully');
      
      // Refresh product images
      fetchProductImages(productId);
      
      // Show preview using response.data.data.image_url
      setImagePreview(response.data.data.image_url);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert(error.response?.data?.message || 'Failed to upload image');
  }
};
```

**UI Helper Text:**
```
Recommended image ratio: 4:5 portrait
Recommended resolution: 2160px × 2700px
Maximum 5 images per product
Allowed formats: JPG, JPEG, PNG, WEBP
Maximum file size: 5MB
```

---

### Customer Manual bKash Checkout

```javascript
// In checkout page component

const handleManualBkashCheckout = async () => {
  try {
    // Validate
    if (!bkashSenderNumber) {
      alert('Sender bKash number is required');
      return;
    }

    if (!bkashTransactionId) {
      alert('Transaction ID is required');
      return;
    }

    if (!paidAmount) {
      alert('Paid amount is required');
      return;
    }

    if (!paymentScreenshot) {
      alert('Payment screenshot is required');
      return;
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(paymentScreenshot.type)) {
      alert('Only JPG, JPEG, PNG, and WEBP images are allowed');
      return;
    }

    if (paymentScreenshot.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Validate paid amount
    if (parseFloat(paidAmount) < orderTotal) {
      alert(`Paid amount must be at least ৳${orderTotal}`);
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('phone', phone);
    formData.append('address', address);
    formData.append('district_id', districtId);
    formData.append('area', area);
    formData.append('paymentMethod', 'manual_bkash');
    formData.append('bkashSenderNumber', bkashSenderNumber);
    formData.append('bkashTransactionId', bkashTransactionId);
    formData.append('paidAmount', paidAmount);
    formData.append('paymentScreenshot', paymentScreenshot);
    formData.append('items', JSON.stringify(cartItems));

    // Submit order
    const response = await axios.post('/api/orders', formData, {
      headers: {
        // Don't set Content-Type - let axios set it
      }
    });

    if (response.data.success) {
      // Clear cart
      clearCart();
      
      // Redirect to success page
      navigate(`/order-success/${response.data.data.order_number}`);
    }
  } catch (error) {
    console.error('Order error:', error);
    alert(error.response?.data?.message || 'Failed to place order');
  }
};
```

**UI for Manual bKash:**
```jsx
{paymentMethod === 'manual_bkash' && (
  <div className="bkash-payment-section">
    <div className="bkash-info">
      <h3>Baynoore bKash Number</h3>
      <p className="bkash-number">+8801794529766</p>
      <p className="instruction">
        Please send the exact total amount to the Baynoore bKash number above.
        Then enter your sender number, transaction ID, paid amount, and upload
        a screenshot of the payment confirmation.
      </p>
    </div>

    <input
      type="text"
      placeholder="Your bKash Number (01XXXXXXXXX)"
      value={bkashSenderNumber}
      onChange={(e) => setBkashSenderNumber(e.target.value)}
      required
    />

    <input
      type="text"
      placeholder="Transaction ID"
      value={bkashTransactionId}
      onChange={(e) => setBkashTransactionId(e.target.value)}
      required
    />

    <input
      type="number"
      placeholder="Paid Amount"
      value={paidAmount}
      onChange={(e) => setPaidAmount(e.target.value)}
      required
    />

    <div className="file-upload">
      <label>Payment Screenshot *</label>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => setPaymentScreenshot(e.target.files[0])}
        required
      />
      <p className="helper-text">
        JPG, JPEG, PNG, or WEBP. Maximum 5MB.
      </p>
    </div>
  </div>
)}
```

---

### Admin Order Details - bKash Verification

```javascript
// In admin order details component

const OrderDetails = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [manualPayment, setManualPayment] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    const response = await axios.get(`/api/admin/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setOrder(response.data.data);
    
    // If manual payment exists
    if (response.data.data.manual_payment) {
      setManualPayment(response.data.data.manual_payment);
    }
  };

  return (
    <div>
      {/* Order details */}
      
      {/* bKash Payment Verification Card */}
      {order.payment_method === 'manual_bkash' && manualPayment && (
        <div className="bkash-verification-card">
          <h3>bKash Payment Verification</h3>
          
          <div className="payment-info">
            <p><strong>Sender Number:</strong> {manualPayment.sender_number}</p>
            <p><strong>Transaction ID:</strong> {manualPayment.transaction_id}</p>
            <p><strong>Paid Amount:</strong> ৳{manualPayment.amount}</p>
            <p><strong>Status:</strong> 
              <span className={`status-${manualPayment.verification_status}`}>
                {manualPayment.verification_status}
              </span>
            </p>
          </div>

          {manualPayment.screenshot_url && (
            <div className="screenshot-preview">
              <h4>Payment Screenshot</h4>
              <img 
                src={manualPayment.screenshot_url} 
                alt="Payment Screenshot"
                style={{ maxWidth: '400px', cursor: 'pointer' }}
                onClick={() => window.open(manualPayment.screenshot_url, '_blank')}
              />
              <a 
                href={manualPayment.screenshot_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Open Full Size
              </a>
            </div>
          )}

          {manualPayment.verification_status === 'pending' && (
            <div className="verification-actions">
              <button onClick={() => markBkashPaid(orderId)}>
                Mark as Paid
              </button>
              <button onClick={() => markBkashFailed(orderId)}>
                Mark as Failed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## ⚠️ Important Notes

### Security
1. **Never expose Cloudinary secrets to frontend**
   - All uploads go through backend API
   - Frontend only receives public URLs
   - Cloudinary credentials stay in backend `.env`

2. **Payment screenshots are permanent records**
   - Do not delete payment screenshots automatically
   - They are proof of payment for disputes
   - Only delete if explicitly requested by super admin

3. **Validate file types and sizes**
   - Backend validates file type by MIME type
   - Backend enforces 5MB limit
   - Frontend should also validate for better UX

### Database
1. **Run migration before testing**
   - `manual_payments` table needs new columns
   - Migration is safe to run multiple times
   - Check if columns exist before running

2. **Storage provider tracking**
   - `storage_provider` column tracks where file is stored
   - 'cloudinary' for Cloudinary uploads
   - 'local' for old local uploads (if any)

### Cloudinary
1. **Folder structure**
   - Product images: `baynoore/products`
   - Payment screenshots: `baynoore/payments`
   - Organized and easy to manage

2. **Free tier limits**
   - 25 GB storage
   - 25 GB bandwidth/month
   - Should be sufficient for MVP
   - Monitor usage in Cloudinary dashboard

3. **Image optimization**
   - Cloudinary automatically optimizes images
   - Serves in best format (WebP when supported)
   - Responsive image delivery
   - CDN for fast loading

---

## 🐛 Troubleshooting

### Error: "Image upload service is not configured"
**Cause:** Cloudinary environment variables are missing or incorrect

**Solution:**
1. Check `.env` file has all three variables:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
2. Restart backend server after adding variables
3. Verify credentials are correct in Cloudinary dashboard

---

### Error: "Failed to delete image from cloud storage"
**Cause:** Cloudinary delete failed (network issue, invalid public_id, etc.)

**Solution:**
1. Check internet connection
2. Verify public_id is correct in database
3. Check Cloudinary dashboard - file might already be deleted
4. If file doesn't exist in Cloudinary, manually delete DB row

---

### Error: "Only JPG, JPEG, PNG, and WEBP images are allowed"
**Cause:** Wrong file type uploaded

**Solution:**
1. Check file extension
2. Check MIME type
3. Convert file to supported format
4. Ensure file is not corrupted

---

### Error: "Image size must be less than 5MB"
**Cause:** File too large

**Solution:**
1. Compress image before upload
2. Use tools like TinyPNG, Squoosh, or Photoshop
3. Reduce image dimensions if too large
4. Consider increasing limit if needed (update in uploadMiddleware.js)

---

### Images not appearing in Cloudinary dashboard
**Cause:** Upload succeeded but folder not visible

**Solution:**
1. Check Media Library in Cloudinary dashboard
2. Look for folders: `baynoore/products` and `baynoore/payments`
3. Verify `public_id` in database matches Cloudinary
4. Check Cloudinary activity log for upload events

---

## ✅ Testing Checklist

- [ ] Cloudinary credentials added to `.env`
- [ ] Database migration run successfully
- [ ] Backend server restarted
- [ ] Product image upload works
- [ ] Image appears in Cloudinary dashboard
- [ ] Image URL is Cloudinary URL (not local)
- [ ] `storage_provider` = 'cloudinary' in database
- [ ] `public_id` is populated in database
- [ ] Product image delete works
- [ ] Image deleted from Cloudinary
- [ ] 6th image upload blocked
- [ ] Wrong file type blocked
- [ ] File > 5MB blocked
- [ ] COD order works (JSON)
- [ ] Manual bKash order works (multipart)
- [ ] Manual bKash without screenshot blocked
- [ ] Manual bKash without transaction ID blocked
- [ ] Payment screenshot appears in Cloudinary
- [ ] `screenshot_url` is Cloudinary URL
- [ ] `screenshot_public_id` is populated
- [ ] Order tracking works
- [ ] Order tracking doesn't expose screenshot URL

---

## 📊 Summary

### What Changed
- ✅ Installed Cloudinary and streamifier packages
- ✅ Created Cloudinary configuration
- ✅ Created upload utilities
- ✅ Updated upload middleware to use memory storage
- ✅ Updated product image controller for Cloudinary
- ✅ Updated order controller for Cloudinary
- ✅ Updated routes with better error handling
- ✅ Created database migration
- ✅ Updated .env.example

### Upload Routes Affected
1. **POST /api/admin/products/:productId/images** - Product image upload
2. **DELETE /api/admin/product-images/:imageId** - Product image delete
3. **POST /api/orders** - Order creation with payment screenshot

### New Environment Variables
```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Remaining Issues
None - Implementation is complete and ready for testing.

---

## 🚀 Next Steps

1. **Add Cloudinary credentials to `.env`**
2. **Run database migration**
3. **Restart backend server**
4. **Test product image upload**
5. **Test manual bKash order with screenshot**
6. **Implement frontend upload forms**
7. **Test end-to-end flow**
8. **Monitor Cloudinary usage**

---

**Implementation completed successfully!** 🎉
