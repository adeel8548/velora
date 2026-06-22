# API Documentation - Product Management & Shopping

## Product Endpoints

### GET /api/products
**Description**: List all products with optional filtering
**Method**: GET
**Auth**: None (Public)

**Query Parameters:**
- `category`: Filter by category ID
- `subcategory`: Filter by subcategory ID
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `q`: Search query for product name/description
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12)

**Response:**
```json
{
  "products": [
    {
      "_id": "60d5ec49c1234567890abcde",
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "stock": 50,
      "category": "60d5ec49c1234567890abcd1",
      "subcategory": "60d5ec49c1234567890abcd2",
      "productImage": "http://localhost:5000/uploads/product_main_1234567890.jpg",
      "images": [
        "http://localhost:5000/uploads/product_gallery_1234567891.jpg",
        "http://localhost:5000/uploads/product_gallery_1234567892.jpg"
      ]
    }
  ]
}
```

---

### GET /api/products/:id
**Description**: Get detailed product information
**Method**: GET
**Auth**: None (Public)

**Response:**
```json
{
  "product": {
    "_id": "60d5ec49c1234567890abcde",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "stock": 50,
    "category": { "_id": "...", "name": "Electronics" },
    "subcategory": { "_id": "...", "name": "Phones" },
    "productImage": "http://localhost:5000/uploads/product_main_1234567890.jpg",
    "images": [
      "http://localhost:5000/uploads/product_gallery_1234567891.jpg",
      "http://localhost:5000/uploads/product_gallery_1234567892.jpg"
    ]
  }
}
```

---

### POST /api/products
**Description**: Create a new product (Admin only)
**Method**: POST
**Auth**: Required (JWT Bearer token)
**Role**: Admin

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
name: "Product Name" (required)
description: "Product description"
price: 99.99 (required)
stock: 50
category: "60d5ec49c1234567890abcd1" (optional)
subcategory: "60d5ec49c1234567890abcd2" (optional)
productImage: <file> (single image file, optional)
images: <file> (multiple image files, up to 10 files, optional)
```

**Response:**
```json
{
  "message": "Product created",
  "product": {
    "_id": "60d5ec49c1234567890abcde",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "stock": 50,
    "category": "60d5ec49c1234567890abcd1",
    "subcategory": "60d5ec49c1234567890abcd2",
    "productImage": "http://localhost:5000/uploads/product_main_1234567890.jpg",
    "images": [
      "http://localhost:5000/uploads/product_gallery_1234567891.jpg",
      "http://localhost:5000/uploads/product_gallery_1234567892.jpg"
    ]
  }
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <token>" \
  -F "name=iPhone 15" \
  -F "description=Latest iPhone model" \
  -F "price=999.99" \
  -F "stock=50" \
  -F "category=<category_id>" \
  -F "subcategory=<subcategory_id>" \
  -F "productImage=@/path/to/main_image.jpg" \
  -F "images=@/path/to/gallery_1.jpg" \
  -F "images=@/path/to/gallery_2.jpg"
```

---

### PUT /api/products/:id
**Description**: Update product information
**Method**: PUT
**Auth**: Required (JWT Bearer token)
**Role**: Admin

**Body (JSON):**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "price": 109.99,
  "stock": 45,
  "category": "60d5ec49c1234567890abcd1",
  "subcategory": "60d5ec49c1234567890abcd2"
}
```

**Note**: Image updates require a new POST to add images or would need separate endpoint

---

### DELETE /api/products/:id
**Description**: Delete a product
**Method**: DELETE
**Auth**: Required (JWT Bearer token)
**Role**: Admin

**Response:**
```json
{
  "message": "Product deleted"
}
```

---

## Category Endpoints

### GET /api/categories
**Description**: List all categories
**Method**: GET
**Auth**: None (Public)

**Response:**
```json
{
  "categories": [
    {
      "_id": "60d5ec49c1234567890abcd1",
      "name": "Electronics",
      "description": "Electronic devices and accessories"
    }
  ]
}
```

---

### POST /api/admin/categories
**Description**: Create new category (Admin only)
**Method**: POST
**Auth**: Required
**Role**: Admin

**Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories"
}
```

---

## Subcategory Endpoints

### GET /api/subcategories
**Description**: List all subcategories with category info
**Method**: GET
**Auth**: None (Public)

**Response:**
```json
{
  "subcategories": [
    {
      "_id": "60d5ec49c1234567890abcd2",
      "name": "Smartphones",
      "category": {
        "_id": "60d5ec49c1234567890abcd1",
        "name": "Electronics"
      }
    }
  ]
}
```

---

### POST /api/admin/subcategories
**Description**: Create new subcategory (Admin only)
**Method**: POST
**Auth**: Required
**Role**: Admin

**Body:**
```json
{
  "name": "Smartphones",
  "category": "60d5ec49c1234567890abcd1"
}
```

---

## Image Upload Details

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Constraints
- Maximum files per request: 11 (1 main + 10 gallery)
- Main image: 1 file maximum
- Gallery images: Up to 10 files
- File size: Limited by server multer config (typically 50MB per file)

### File Storage
- Location: `/uploads` directory on server
- Naming: `<field>_<timestamp>_<random>.extension`
- URL Format: `http://localhost:5000/uploads/<filename>`

### Best Practices
1. Always upload a main product image for best UX
2. Upload 3-5 gallery images for comprehensive product view
3. Use high-quality images (recommended 1200x1200px minimum)
4. Compress images before upload for better performance
5. Ensure images are relevant to the product

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error",
  "error": "Price is required"
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Product not found"
}
```

### 500 Server Error
```json
{
  "message": "Server error",
  "error": "Database connection failed"
}
```

---

## Frontend Integration Examples

### Fetch Products
```javascript
import api from './api';

// List all products
const response = await api.get('/products');
const products = response.data.products;

// Get single product
const product = await api.get(`/products/${productId}`);

// Search products
const results = await api.get('/products?q=laptop&minPrice=500&maxPrice=1500');
```

### Create Product (Admin)
```javascript
const formData = new FormData();
formData.append('name', 'iPhone 15');
formData.append('description', 'Latest iPhone');
formData.append('price', 999.99);
formData.append('stock', 50);
formData.append('category', categoryId);
formData.append('subcategory', subcategoryId);
formData.append('productImage', mainImageFile);
galleryImages.forEach(img => formData.append('images', img));

const response = await api.post('/products', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### Add to Cart (Redux)
```javascript
import { useDispatch } from 'react-redux';
import { addItem } from './store/cartSlice';

const dispatch = useDispatch();

dispatch(addItem({
  product: product._id,
  name: product.name,
  price: product.price,
  image: product.productImage,
  quantity: 2
}));
```

---

## Performance Tips

1. **Image Optimization**:
   - Compress images to reduce file size
   - Use modern formats (WebP) when possible
   - Implement lazy loading in ProductList

2. **API Calls**:
   - Cache product list in Redux
   - Use pagination for large product lists
   - Implement search debouncing

3. **Database**:
   - Index frequently filtered fields (category, price)
   - Use pagination to avoid large result sets
   - Consider image CDN for better performance

---

## Version History

- **v1.0** - Initial multi-image product gallery implementation
  - Product creation with single main image and multiple gallery images
  - Product details page with thumbnail switching
  - Shopping cart with add-to-cart functionality
  - Admin product form with dual image upload
