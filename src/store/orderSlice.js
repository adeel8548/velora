import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchUserOrders as fetchUserOrdersFromDb,
  placeOrder,
} from "../services/orderService";

export const fetchUserOrdersThunk = createAsyncThunk(
  "orders/fetchUserOrders",
  async (userId, thunkAPI) => {
    try {
      return await fetchUserOrdersFromDb(userId);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Fetch failed");
    }
  },
);

export const fetchUserOrders = fetchUserOrdersThunk;

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData, thunkAPI) => {
    try {
      return await placeOrder(orderData);
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Order creation failed");
    }
  },
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    items: [],
    currentOrder: null,
    status: "idle",
    error: null,
  },
  reducers: {
    clearOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserOrdersThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserOrdersThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchUserOrdersThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(createOrder.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentOrder = action.payload;
        state.items.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearOrder } = orderSlice.actions;
export default orderSlice.reducer;
