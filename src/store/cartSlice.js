import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] },
  reducers: {
    addItem(state, action) {
      const item = state.items.find(
        (i) => i.product === action.payload.product,
      );
      if (item) item.quantity += action.payload.quantity;
      else state.items.push(action.payload);
    },
    removeItem(state, action) {
      state.items = state.items.filter((i) => i.product !== action.payload);
    },
    increaseQuantity(state, action) {
      const item = state.items.find((i) => i.product === action.payload);
      if (item) item.quantity += 1;
    },
    decreaseQuantity(state, action) {
      const item = state.items.find((i) => i.product === action.payload);
      if (item && item.quantity > 1) item.quantity -= 1;
      else if (item && item.quantity === 1) {
        state.items = state.items.filter((i) => i.product !== action.payload);
      }
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const {
  addItem,
  removeItem,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
