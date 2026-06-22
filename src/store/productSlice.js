import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAllProducts } from "../services/productService";
import { syncScheduledPromotions } from "../services/promotionService";
import { DEMO_PRODUCTS } from "../data/demoProducts";

export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (_, thunkAPI) => {
    try {
      await syncScheduledPromotions();
      const products = await fetchAllProducts();
      if (products.length > 0) return products;
      return DEMO_PRODUCTS;
    } catch (err) {
      console.warn("Supabase fetch failed, using demo:", err.message);
      return DEMO_PRODUCTS;
    }
  },
);

const productSlice = createSlice({
  name: "products",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.items = DEMO_PRODUCTS;
      });
  },
});

export default productSlice.reducer;
