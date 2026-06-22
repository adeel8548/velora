# Testing Guide - Multi-Image Product Gallery

## Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- MongoDB connection active
- Admin account created (via `/api/admin/setup` if needed)

---

## Test Case 1: Upload Product with Multiple Images

### Step 1: Admin Login
1. Navigate to `http://localhost:3000/admin/login`
2. Enter admin email and password
3. Should redirect to admin dashboard

### Step 2: Go to Admin Products
1. Click on "Products" tab in admin dashboard
2. Should see "Add Product" form

### Step 3: Fill Product Form
1. Enter Product Name: "Test Laptop"
2. Enter Description: "High-performance laptop for professionals"
3. Enter Price: "1299.99"
4. Enter Stock: "25"
5. Select Category: Choose any category
6. Select Subcategory: Choose any subcategory

### Step 4: Upload Images
1. Click "Main Product Image" file input
2. Select an image from your computer (main_image.jpg)
3. Click "Gallery Images (multiple)" file input
4. Select 3-4 images (gallery_1.jpg, gallery_2.jpg, gallery_3.jpg, gallery_4.jpg)
5. Should see text: "4 image(s) selected"

### Step 5: Create Product
1. Click "Create Product" button
2. Wait for confirmation message
3. Product should appear in the products list

**Expected Result**: ✓ Product created with main image and gallery images

---

## Test Case 2: View Product Details with Gallery

### Step 1: Navigate to Products
1. Go to `http://localhost:3000` (home/products page)
2. Should see product list with images

### Step 2: Verify Product Image Display
1. Check that your test product shows main image in the product card
2. Product card should show thumbnail properly

### Step 3: Click View Product
1. Click "View" button on your test product
2. Should navigate to `/product/<product-id>`

### Step 4: Verify Image Gallery
1. Should see large main image in center
2. Should see 4-5 thumbnail images on the left side
3. Thumbnails should have border (darker border on current main image)

**Expected Result**: ✓ Gallery displays with current image having visible border indicator

---

## Test Case 3: Image Switching via Thumbnails

### Step 1: Switch Images
1. Click on the 2nd thumbnail image
2. Main image should change smoothly
3. Thumbnail should get darker border
4. Previous thumbnail border should lighten

### Step 2: Rapid Switching
1. Click multiple thumbnails rapidly
2. Main image should update smoothly each time
3. No errors in browser console

### Step 3: All Thumbnails
1. Click each thumbnail one by one
2. Verify each one updates the main image correctly
3. Last thumbnail should also work properly

**Expected Result**: ✓ All image switches work smoothly with visual feedback

---

## Test Case 4: Add to Cart Functionality

### Step 1: Select Quantity
1. Change quantity input from 1 to 3
2. Input should update to 3

### Step 2: Add to Cart
1. Click "Add to Cart" button
2. Button should change to green "✓ Added to Cart"
3. After 2 seconds, should revert to "Add to Cart"

### Step 3: Check Cart
1. Click "Cart" link in navbar
2. Should see product with:
   - Product image thumbnail
   - Product name
   - Product price
   - Quantity: 3
   - Total for this item: price × 3

**Expected Result**: ✓ Product correctly added to cart with right quantity and total

---

## Test Case 5: Multiple Items in Cart

### Step 1: Add Another Product
1. Go back to products page
2. Find a different product
3. Change quantity to 2
4. Click Add to Cart

### Step 2: View Cart
1. Click Cart in navbar
2. Should see 2 different products
3. Each with correct quantity and subtotal
4. Total should be sum of both: (product1_price × qty1) + (product2_price × qty2)

### Step 3: Remove Item
1. Click "Remove" on first product
2. Should disappear from cart
3. Total should update correctly
4. Second product should still be there

### Step 4: Clear Cart
1. Click "Clear Cart" button
2. All items should disappear
3. Should see "Your Cart is Empty" message
4. Should see "Continue Shopping" link

**Expected Result**: ✓ Multi-item cart works correctly with accurate totals

---

## Test Case 6: Empty Cart Handling

### Step 1: Empty Cart State
1. Clear all items from cart
2. Navigate to `/cart`
3. Should see message: "Your Cart is Empty"
4. Should see "Continue Shopping" link

### Step 2: Navigate Away and Back
1. Click "Continue Shopping"
2. Should go to products page
3. Navigate back to cart
4. Should still show empty state

**Expected Result**: ✓ Empty cart shows proper message

---

## Test Case 7: Product Card Display

### Step 1: Check Product Images in List
1. Go to products page
2. Look at product cards
3. Each product card should show:
   - Main image (productImage) or first gallery image
   - Product name
   - Description preview
   - Price
   - "View" link

### Step 2: Image Fallback
1. Create a product without main image, only gallery images
2. Should display first gallery image in product card
3. Should display "No Image" text if no images at all

### Step 3: Hover Effect
1. Hover over product cards
2. Should see shadow increase (hover effect)
3. Links should change color

**Expected Result**: ✓ Product cards display properly with all information

---

## Test Case 8: Browser Console

### During All Tests:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Should see NO errors or warnings related to:
   - Image loading failures
   - Redux action errors
   - API errors
4. Network tab should show successful requests to `/api/products` and `/api/products/:id`

**Expected Result**: ✓ No errors in console during any operation

---

## Test Case 9: Responsive Design

### Desktop View (1920px+)
1. Product image on left takes ~60% width
2. Thumbnails on left side of main image
3. Product details on right side
4. All elements properly aligned

### Tablet View (768px-1024px)
1. Layout should adjust gracefully
2. Thumbnails might wrap or resize
3. All functionality still works

### Mobile View (320px-480px)
1. Main image full width
2. Thumbnails below main image
3. All buttons accessible
4. No horizontal scrolling

**Expected Result**: ✓ Design responds correctly to all screen sizes

---

## Test Case 10: Performance

### Step 1: Load Time
1. Open DevTools Network tab
2. Navigate to products page
3. Should load in < 3 seconds
4. Image requests should be reasonable size

### Step 2: Image Switching
1. Click thumbnails rapidly
2. Should be smooth (no lag)
3. Memory usage should remain stable

### Step 3: Cart Operations
1. Add/remove items rapidly
2. Should respond instantly
3. No lag in UI

**Expected Result**: ✓ Performance is smooth and responsive

---

## Troubleshooting

### Issue: Images not showing
**Solution**: 
- Check backend is serving `/uploads` directory
- Verify multer created the uploads folder
- Check file permissions on uploads folder

### Issue: Add to Cart not working
**Solution**:
- Check Redux store is properly configured
- Verify cartSlice.js is correct
- Check browser console for errors

### Issue: Quantity not updating
**Solution**:
- Ensure input type is "number"
- Check min/max attributes match stock
- Verify onChange handler is working

### Issue: Gallery not showing thumbnails
**Solution**:
- Check product has images array populated
- Verify API response includes images field
- Check images are valid URLs

### Issue: CORS errors
**Solution**:
- Verify backend has CORS enabled
- Check frontend API baseURL is correct
- Verify token is being sent in headers

---

## API Test Requests (Using Postman/cURL)

### Create Product with Images
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <your_token>" \
  -F "name=Test Product" \
  -F "description=Test Description" \
  -F "price=99.99" \
  -F "stock=10" \
  -F "productImage=@main_image.jpg" \
  -F "images=@gallery1.jpg" \
  -F "images=@gallery2.jpg"
```

### Get Product with Images
```bash
curl http://localhost:5000/api/products/<product_id>
```

### List All Products
```bash
curl http://localhost:5000/api/products
```

---

## Success Criteria Checklist

- [ ] Products can be created with main image and multiple gallery images
- [ ] ProductDetails page displays gallery with thumbnails
- [ ] Image switching works smoothly
- [ ] Add to Cart button is functional
- [ ] Cart displays all items with correct quantities
- [ ] Cart totals are calculated correctly
- [ ] Remove item from cart works
- [ ] Clear cart button works
- [ ] Empty cart shows proper message
- [ ] No console errors
- [ ] UI is responsive on all screen sizes
- [ ] Performance is smooth and responsive

---

## Notes

- Each product can have up to 1 main image + 10 gallery images
- Images are stored on server in `/uploads` folder
- Cart persists in Redux store (clears on page refresh - can add localStorage for persistence)
- All operations properly validate and show error messages when needed
