# Quick Start Guide - Multi-Image Gallery & Cart System

## 🚀 Getting Started

### Backend Setup
```bash
cd Server
npm install
npm start
# Backend runs on http://localhost:5000
```

### Frontend Setup
```bash
cd Frontend
npm install
npm start
# Frontend runs on http://localhost:3000
```

---

## 📋 Key Features Implemented

### ✅ Multi-Image Product System
- **Main Product Image**: Single primary image shown in product cards
- **Gallery Images**: Up to 10 additional images for detailed viewing
- **Image Switching**: Click thumbnails to change main display image
- **Smooth Effects**: Seamless transitions between images

### ✅ Admin Product Management
- Upload main product image
- Upload multiple gallery images (up to 10)
- Display count of selected gallery images
- Create products with categories and subcategories

### ✅ Product Details Page
- Large main image display (center)
- Thumbnail gallery on left sidebar
- Click-to-switch image functionality
- Visual indicator (border) for current image
- Quantity selector
- Fully functional add-to-cart button

### ✅ Shopping Cart
- View all added items
- See product image, name, price, quantity
- Calculate item subtotals automatically
- Remove individual items
- Clear entire cart
- See total cart value
- Empty cart state with continue shopping link

### ✅ Product Listing
- Display all products with images
- Show main image or first gallery image
- Product name and price
- "View" button to see details
- Responsive grid layout

---

## 🔧 How to Use

### Admin: Create Product with Multiple Images

1. **Login as Admin**
   - Go to http://localhost:3000/admin/login
   - Use your admin credentials

2. **Navigate to Admin Dashboard**
   - Click "Products" tab

3. **Fill Product Form**
   ```
   Name: "iPhone 15 Pro"
   Description: "Latest iPhone with advanced features"
   Price: 999.99
   Stock: 50
   Category: [Select from dropdown]
   Subcategory: [Select from dropdown]
   ```

4. **Upload Images**
   - Click "Main Product Image" → Select 1 image
   - Click "Gallery Images (multiple)" → Select 3-5 images
   - Confirm "X image(s) selected" appears

5. **Create Product**
   - Click "Create Product" button
   - Wait for success message

### User: Browse and Shop

1. **View Products**
   - Go to http://localhost:3000
   - See all products in grid layout
   - Each shows main image, name, price

2. **View Product Details**
   - Click "View" button on any product
   - See large main image + thumbnail gallery
   - Browse all product images by clicking thumbnails

3. **Add to Cart**
   - Change quantity if needed
   - Click "Add to Cart" button
   - See green "✓ Added to Cart" confirmation

4. **View Cart**
   - Click "Cart" in navbar
   - See all items with quantities and totals
   - Remove items or clear cart
   - See total price

---

## 📁 File Structure

### Backend Changes
```
Server/
├── routes/
│   └── products.js           ✓ Updated to use .fields() for dual upload
└── controllers/
    └── productController.js  ✓ Already handles both image fields
```

### Frontend Changes
```
Frontend/src/
├── components/
│   └── admin/
│       └── AdminProductForm.js    ✓ Dual image upload (main + gallery)
├── pages/
│   ├── ProductDetails.js          ✓ Full gallery with thumbnails
│   ├── ProductList.js             ✓ Image display in cards
│   └── Cart.js                    ✓ Complete cart implementation
└── store/
    └── cartSlice.js               ✓ Redux cart management
```

---

## 🎯 Data Flow

### Product Creation
```
Admin Form
  ↓ (with productImage + images files)
  ↓ FormData
  ↓ POST /api/products
  ↓ Multer .fields() processes both
  ↓ Backend saves URLs to DB
  ↓ Response with saved URLs
```

### Product Viewing
```
ProductList
  ↓ GET /api/products
  ↓ Display main image or first gallery image
  ↓ Click View
  ↓ ProductDetails
  ↓ GET /api/products/:id
  ↓ Display main + all gallery images
```

### Cart Management
```
ProductDetails
  ↓ Click Add to Cart
  ↓ dispatch(addItem({...product data...}))
  ↓ Redux cartSlice.addItem()
  ↓ Cart updated in Redux state
  ↓ Navigate to Cart page
  ↓ Display all items from Redux state
```

---

## 🖼️ Image Upload Specifications

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)  
- GIF (.gif)
- WebP (.webp)

### Upload Limits
- **Main Image**: 1 file
- **Gallery Images**: Up to 10 files
- **Total per product**: 11 files maximum

### Recommended Sizes
- **Resolution**: 1200x1200px minimum
- **Format**: JPEG for photos, PNG for graphics
- **Compression**: Pre-compress before upload for best performance

### Storage Location
- Saved in `/uploads` directory on server
- Accessible via: `http://localhost:5000/uploads/<filename>`

---

## 🗄️ Database Model

### Product Schema
```javascript
{
  name: String,                    // Product name
  description: String,             // Product description
  price: Number,                   // Product price
  stock: Number,                   // Available quantity
  category: ObjectId,              // Reference to Category
  subcategory: ObjectId,           // Reference to Subcategory
  productImage: String,            // Main image URL
  images: [String]                 // Gallery image URLs (array)
}
```

### Cart Item Structure (Redux)
```javascript
{
  product: String,       // Product ID
  name: String,          // Product name
  price: Number,         // Product price
  image: String,         // Image URL to display
  quantity: Number       // Quantity selected
}
```

---

## 🔌 API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### File Upload
- Max 1 file for `productImage` field
- Max 10 files for `images` field
- All handled via multipart/form-data

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Images not showing | Check `/uploads` folder exists and has files |
| Add to Cart not working | Clear Redux state, check browser console |
| Upload fails | Verify multer configured correctly, check file size |
| Gallery not appearing | Ensure product has images array populated |
| Cart not persisting | Note: Currently stored in Redux only (not localStorage) |

---

## 📊 Redux State Structure

```javascript
{
  cart: {
    items: [
      {
        product: "...",
        name: "...",
        price: 99.99,
        image: "...",
        quantity: 2
      }
    ]
  }
}
```

---

## 🎨 UI Components Overview

### ProductDetails Component
- **Layout**: 2-column (images left, details right)
- **Main Image**: Large display area
- **Thumbnails**: Left sidebar with all images
- **Click Handler**: Select image on thumbnail click
- **Visual Feedback**: Border highlight on active thumbnail
- **Quantity Input**: Number selector
- **Add to Cart**: Redux-connected button

### Cart Component
- **Item List**: Each item in card format
- **Item Info**: Image, name, price, quantity
- **Calculations**: Auto-calculated subtotals and total
- **Actions**: Remove item, Clear cart, Checkout
- **Empty State**: Message and link to continue shopping

### AdminProductForm Component
- **Form Fields**: Name, Description, Price, Stock, Category, Subcategory
- **Main Image Upload**: Single file input
- **Gallery Upload**: Multiple file input with count display
- **Validation**: Required fields check
- **Submission**: Appends both file arrays to FormData

---

## 🔐 Security Notes

- Admin routes protected with JWT authentication
- File upload validated for image types only
- File size limits enforced by multer
- All product operations check admin role

---

## 📈 Next Steps (Future Enhancements)

1. **Add Image Validation**
   - Server-side image dimension checking
   - Format validation

2. **Implement Checkout**
   - Integrate Stripe payment
   - Create Order model

3. **Cart Persistence**
   - Save cart to localStorage
   - Retrieve on page reload

4. **Image Optimization**
   - Implement image compression
   - Add lazy loading
   - Consider CDN integration

5. **Advanced Features**
   - Product reviews/ratings
   - Wishlist functionality
   - Order tracking
   - Image gallery lightbox modal

---

## 📞 Support

For issues or questions about:
- **Multi-image uploads**: Check multer configuration
- **Gallery display**: Verify images array is populated
- **Cart functionality**: Check Redux dev tools
- **API errors**: Check browser console and network tab

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Ready for Testing ✅
