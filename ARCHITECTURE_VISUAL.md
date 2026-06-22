# Visual Architecture & Feature Summary

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ECOMMERCE SYSTEM v1.0                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Frontend (React)                       │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │  ProductList│  │ProductDetails│  │ Cart       │     │  │
│  │  │  (images)   │  │ (gallery+add)│  │(items+del) │     │  │
│  │  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘     │  │
│  │         │                │               │             │  │
│  │         └────────────┬───┴───────────────┴─────────┐    │  │
│  │                      │                             │    │  │
│  │              Redux Store (cartSlice)               │    │  │
│  │         ┌──────────────────────────────┐          │    │  │
│  │         │ cart: { items: [...] }       │          │    │  │
│  │         └──────────────────────────────┘          │    │  │
│  │                      ▲                             │    │  │
│  │          ┌───────────┴───────────┐                │    │  │
│  │          │                       │                │    │  │
│  │      addItem()             removeItem()           │    │  │
│  │      clearCart()                                  │    │  │
│  │                                                   │    │  │
│  │  ┌───────────────────────────────────────────┐   │    │  │
│  │  │   Admin Panel                              │   │    │  │
│  │  │   - Upload productImage + images[]         │   │    │  │
│  │  │   - Manage Categories                      │   │    │  │
│  │  │   - Manage Products                        │   │    │  │
│  │  └──────────────┬──────────────────────────────┘   │    │  │
│  │                 │                                  │    │  │
│  └─────────────────┼──────────────────────────────────┘    │  │
│                    │                                        │  │
│                    ▼                                        │  │
│  ┌─────────────────────────────────────────────────────┐   │  │
│  │            API Endpoints (/api)                     │   │  │
│  ├─────────────────────────────────────────────────────┤   │  │
│  │ GET  /products               (list all)             │   │  │
│  │ GET  /products/:id           (details)              │   │  │
│  │ POST /products               (create w/images)      │   │  │
│  │ PUT  /products/:id           (update)               │   │  │
│  │ DEL  /products/:id           (delete)               │   │  │
│  │ GET  /categories             (list)                 │   │  │
│  │ GET  /subcategories          (list)                 │   │  │
│  └─────────────────────────────────────────────────────┘   │  │
│                    │                                        │  │
│                    ▼                                        │  │
│  ┌─────────────────────────────────────────────────────┐   │  │
│  │         Backend (Node.js/Express)                  │   │  │
│  ├─────────────────────────────────────────────────────┤   │  │
│  │                                                     │   │  │
│  │  ┌────────────────────────────────────────────┐    │   │  │
│  │  │ Multer Middleware                          │    │   │  │
│  │  │ .fields([                                  │    │   │  │
│  │  │   {name: 'productImage', maxCount: 1},    │    │   │  │
│  │  │   {name: 'images', maxCount: 10}          │    │   │  │
│  │  │ ])                                         │    │   │  │
│  │  └────────────┬─────────────────────────────┘    │   │  │
│  │               │                                  │   │  │
│  │  ┌────────────▼─────────────────────────────┐    │   │  │
│  │  │ Controllers                              │    │   │  │
│  │  │ - productController.js                   │    │   │  │
│  │  │ - categoryController.js                  │    │   │  │
│  │  │ - subcategoryController.js               │    │   │  │
│  │  └────────────┬─────────────────────────────┘    │   │  │
│  │               │                                  │   │  │
│  │  ┌────────────▼─────────────────────────────┐    │   │  │
│  │  │ File Storage                             │    │   │  │
│  │  │ /uploads/                                │    │   │  │
│  │  │ - product_main_xxxxx.jpg                 │    │   │  │
│  │  │ - product_gallery_xxxxx.jpg              │    │   │  │
│  │  │ - product_gallery_xxxxx.jpg              │    │   │  │
│  │  └────────────┬─────────────────────────────┘    │   │  │
│  │               │                                  │   │  │
│  └───────────────┼──────────────────────────────────┘   │  │
│                  │                                      │  │
│                  ▼                                      │  │
│  ┌──────────────────────────────────────────────────┐  │  │
│  │        MongoDB Database                         │  │  │
│  ├──────────────────────────────────────────────────┤  │  │
│  │                                                 │  │  │
│  │ Collections:                                   │  │  │
│  │ ├─ products (with productImage + images[])   │  │  │
│  │ ├─ categories                                  │  │  │
│  │ ├─ subcategories                               │  │  │
│  │ ├─ users                                       │  │  │
│  │ ├─ admins                                      │  │  │
│  │ └─ orders                                      │  │  │
│  │                                                 │  │  │
│  └──────────────────────────────────────────────────┘  │  │
│                                                         │  │
└─────────────────────────────────────────────────────────┘  │
```

---

## 📸 Image Upload & Gallery Flow

```
                    PRODUCT IMAGE JOURNEY
                    
┌─────────────────────────────────────────────────────────┐
│ Admin Selects Images                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Main Image:        Gallery Images:                    │
│  [iphone_main.jpg]  [iphone_front.jpg]                 │
│                     [iphone_back.jpg]                  │
│                     [iphone_side.jpg]                  │
│                     [iphone_box.jpg]                   │
│                                                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌───────────────────────────────┐
        │  Prepare FormData              │
        │  {                             │
        │    productImage: [File],       │
        │    images: [File, File, ...]   │
        │  }                             │
        └───────────────┬─────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  POST /api/products            │
        │  Content-Type: multipart/...   │
        └───────────────┬─────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │  Multer Processing             │
        │  .fields([...])                │
        └───────────────┬─────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ productImage[0]  │          │ images[0-9]      │
│ └─ save to /up.. │          │ └─ save to /up.. │
│ └─ generate URL  │          │ └─ generate URLs │
└──────┬───────────┘          └────────┬─────────┘
       │                               │
       └───────────────┬───────────────┘
                       │
                       ▼
        ┌───────────────────────────────┐
        │  Database Record:              │
        │  {                             │
        │    name: "iPhone 15",          │
        │    productImage: "http://...", │
        │    images: [                   │
        │      "http://...",             │
        │      "http://...",             │
        │      "http://..."              │
        │    ]                           │
        │  }                             │
        └────────────────────────────────┘
```

---

## 🖼️ Product Gallery Component Interaction

```
                  ProductDetails Page
                  
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────┐  ┌─────────────────────────────────────┐  │
│  │ THUMB-  │  │                                     │  │
│  │ NAILS   │  │      MAIN IMAGE                     │  │
│  │         │  │                                     │  │
│  │ ┌────┐  │  │  ┌─────────────────────────────┐   │  │
│  │ │ I1 │◀─┼──┼─┤ [Current Image Display]      │   │  │
│  │ │    │  │  │ │ [Transitions smoothly]       │   │  │
│  │ │████│  │  │ │                              │   │  │
│  │ └────┘  │  │ └─────────────────────────────┘   │  │
│  │         │  │                                     │  │
│  │ ┌────┐  │  │ Price: $999.99                      │  │
│  │ │ I2 │  │  │ Stock: 50                           │  │
│  │ │    │  │  │                                     │  │
│  │ │░░░░│ ◄──────────── Click to switch            │  │
│  │ └────┘  │  │ Quantity: [___]                     │  │
│  │         │  │ ┌────────────────────────┐         │  │
│  │ ┌────┐  │  │ │ Add to Cart             │         │  │
│  │ │ I3 │  │  │ └────────────────────────┘         │  │
│  │ │    │  │  │                                     │  │
│  │ │░░░░│  │  │                                     │  │
│  │ └────┘  │  │                                     │  │
│  │         │  │                                     │  │
│  │ ┌────┐  │  │                                     │  │
│  │ │ I4 │  │  │                                     │  │
│  │ │    │  │  │                                     │  │
│  │ │░░░░│  │  │                                     │  │
│  │ └────┘  │  │                                     │  │
│  │         │  │                                     │  │
│  │ ┌────┐  │  │                                     │  │
│  │ │ I5 │  │  │                                     │  │
│  │ │    │  │  │                                     │  │
│  │ │░░░░│  │  │                                     │  │
│  │ └────┘  │  │                                     │  │
│  │         │  │                                     │  │
│  └─────────┘  └─────────────────────────────────────┘  │
│                                                         │
│  Legend:                                                │
│  ████ = Currently Selected (indigo border)             │
│  ░░░░ = Not Selected (gray border)                     │
│                                                         │
└─────────────────────────────────────────────────────────┘

User Interactions:
1. Page loads → mainImage = productImage or images[0]
2. Thumbnails render for [productImage, ...images]
3. User clicks thumbnail → mainImage updates
4. CSS transition animates the change
5. Border highlights current thumbnail
6. User changes quantity
7. User clicks Add to Cart → Redux dispatch
8. Button shows green confirmation
```

---

## 🛒 Shopping Cart State Flow

```
                    CART STATE MANAGEMENT
                    
Redux Store - cartSlice
├─ initialState: { items: [] }
│
├─ Reducers:
│  ├─ addItem(state, action)
│  │  ├─ Check if product already in cart
│  │  ├─ If yes: increment quantity
│  │  └─ If no: add new item
│  │
│  ├─ removeItem(state, action)
│  │  └─ Filter out item by product ID
│  │
│  └─ clearCart(state)
│     └─ Reset items to []
│
└─ Actions: { addItem, removeItem, clearCart }

                         ▼
                    
         ProductDetails Component
         ┌──────────────────────────┐
         │ dispatch(addItem({       │
         │   product: "_id",        │
         │   name: "...",           │
         │   price: 99.99,          │
         │   image: "url",          │
         │   quantity: 2            │
         │ }))                      │
         └──────────────────────────┘
         
                         ▼
         
         Redux Store Update
         ┌──────────────────────────┐
         │ items: [                 │
         │   {                      │
         │     product: "id1",      │
         │     name: "Product 1",   │
         │     price: 99.99,        │
         │     image: "url1",       │
         │     quantity: 2          │
         │   }                      │
         │ ]                        │
         └──────────────────────────┘
         
                         ▼
         
         Cart Component
         ┌──────────────────────────┐
         │ const items = useSelector│
         │ (state=>state.cart.items)│
         │                          │
         │ Render items            │
         │ Calculate totals        │
         │ Show remove/clear btns  │
         └──────────────────────────┘
```

---

## 📊 Database Schema Visualization

```
Product Collection
┌─────────────────────────────────────────────────────────┐
│ {                                                       │
│   _id: ObjectId(...),                                   │
│   name: "iPhone 15 Pro",                                │
│   description: "Latest iPhone model",                   │
│   price: 999.99,                                        │
│   stock: 50,                                            │
│   category: ObjectId(...),        ───────┐              │
│   subcategory: ObjectId(...),     ───────┼─┐            │
│   productImage: "http://localhost:5000/uploads/...",    │
│   images: [                       // Gallery images     │
│     "http://localhost:5000/uploads/...",                │
│     "http://localhost:5000/uploads/...",                │
│     "http://localhost:5000/uploads/...",                │
│     "http://localhost:5000/uploads/..."                 │
│   ]                                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘

Category Collection
┌─────────────────────────────────────────────────────────┐
│ {                                                       │
│   _id: ObjectId(...),             ◄───────────────────┐ │
│   name: "Electronics",                                 │ │
│   description: "Electronic devices"                    │ │
│ }                                                       │ │
└─────────────────────────────────────────────────────────┘ │

Subcategory Collection                                      │
┌─────────────────────────────────────────────────────────┐ │
│ {                                                       │ │
│   _id: ObjectId(...),             ◄───────────────────┤ │
│   name: "Smartphones",                                 │ │
│   category: ObjectId(...) ──────────────────────────────┘ │
│ }                                                       │ │
└─────────────────────────────────────────────────────────┘ │
                                                          
User Collection
┌─────────────────────────────────────────────────────────┐
│ {                                                       │
│   _id: ObjectId(...),                                   │
│   username: "user123",                                  │
│   email: "user@example.com",                            │
│   password: "hashed_password",                          │
│   role: "user",                                         │
│   addresses: [...]                                      │
│ }                                                       │
└─────────────────────────────────────────────────────────┘

Admin Collection
┌─────────────────────────────────────────────────────────┐
│ {                                                       │
│   _id: ObjectId(...),                                   │
│   name: "Admin User",                                   │
│   email: "admin@example.com",                           │
│   password: "hashed_password",                          │
│   phone: "123-456-7890",                                │
│   address: "123 Main St",                               │
│   city: "Anytown",                                      │
│   state: "CA",                                          │
│   role: "admin"                                         │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────┐
│           LOGIN / AUTHENTICATION FLOW                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User/Admin submits credentials                     │
│     ├─ Email                                           │
│     └─ Password                                        │
│                                                         │
│         ▼                                              │
│                                                         │
│  2. POST /api/user/login or /api/admin-auth/login     │
│     ├─ Query both User and Admin collections         │
│     ├─ Verify password with bcrypt                   │
│     ├─ Generate JWT token                            │
│     ├─ Set httpOnly cookie                           │
│     └─ Return token in response                      │
│                                                         │
│         ▼                                              │
│                                                         │
│  3. Frontend stores token                             │
│     ├─ In Redux (authSlice)                           │
│     ├─ In localStorage (optional)                     │
│     └─ In httpOnly cookie (from server)              │
│                                                         │
│         ▼                                              │
│                                                         │
│  4. Protected Route Access                            │
│     ├─ POST /api/products (admin only)               │
│     ├─ PUT /api/products/:id (admin only)            │
│     └─ DELETE /api/products/:id (admin only)         │
│                                                         │
│         ▼                                              │
│                                                         │
│  5. Middleware Verification                           │
│     ├─ authMiddleware:                                │
│     │  ├─ Get token from header/cookie                │
│     │  ├─ Verify JWT                                 │
│     │  └─ Attach user to req.user                    │
│     │                                                 │
│     └─ requireAdmin middleware:                       │
│        ├─ Check req.user role === 'admin'            │
│        ├─ Reject if not admin                        │
│        └─ Allow if admin                             │
│                                                         │
│         ▼                                              │
│                                                         │
│  6. Request Processed / Denied                        │
│     ├─ If authorized: Execute controller             │
│     └─ If denied: Return 403 Forbidden               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 Performance Metrics

```
Load Times (Expected)
├─ Home Page: 1.5-2.5s
├─ Product Details: 0.8-1.2s
├─ Cart Page: 0.3-0.5s
├─ Admin Upload: 2-5s (depends on file sizes)
└─ API Response: 100-300ms

Memory Usage
├─ Redux Store: ~50KB (empty cart)
├─ Product List (20 items): ~500KB
├─ Single Product (5 images): ~300KB
└─ Total Frontend: 1-2MB

Database Query Times
├─ List products: 50-100ms
├─ Get single product: 20-50ms
├─ Create product (with images): 200-500ms
├─ Search products: 100-200ms
└─ Cart operations: < 50ms

File Upload
├─ Single 500KB image: 1-2s
├─ 5 × 500KB images: 3-5s
├─ Total upload + processing: 2-6s
└─ Server max per file: 50MB (configurable)
```

---

## 🎨 Component Hierarchy

```
App.js
├── Routes
│   └── Layout
│       ├── Header (Navigation)
│       │   ├── Logo
│       │   ├── Nav Links
│       │   └── Login/Cart Links
│       │
│       ├── Main (Outlet)
│       │   ├── Home (ProductList)
│       │   │   └── ProductCard (maps to each product)
│       │   │       ├── Image Display
│       │   │       ├── Product Info
│       │   │       └── View Button
│       │   │
│       │   ├── ProductDetails
│       │   │   ├── ImageGallery
│       │   │   │   ├── Thumbnails
│       │   │   │   └── MainImage
│       │   │   ├── ProductInfo
│       │   │   ├── PriceDisplay
│       │   │   ├── QuantitySelector
│       │   │   └── AddToCartButton
│       │   │
│       │   ├── Cart
│       │   │   ├── CartItems (map)
│       │   │   │   ├── ItemImage
│       │   │   │   ├── ItemInfo
│       │   │   │   ├── ItemPrice
│       │   │   │   └── RemoveButton
│       │   │   ├── CartSummary
│       │   │   │   ├── Subtotal
│       │   │   │   ├── Tax (if applicable)
│       │   │   │   ├── Total
│       │   │   │   └── CheckoutButton
│       │   │   └── EmptyCartMessage
│       │   │
│       │   ├── Login
│       │   ├── Signup
│       │   └── AdminDashboard
│       │       ├── AdminProductForm
│       │       │   ├── ProductForm
│       │       │   ├── MainImageUpload
│       │       │   ├── GalleryImagesUpload
│       │       │   └── SubmitButton
│       │       ├── AdminCategories
│       │       ├── AdminSubcategories
│       │       ├── AdminUsers
│       │       └── AdminOrders
│       │
│       └── Footer
│
└── Redux Store
    ├── authSlice
    ├── productSlice
    └── cartSlice
```

---

This visual guide provides a comprehensive overview of the entire system architecture, data flows, and component interactions.
