import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchOrdersFromAPI } from './orderAPI';

export const fetchOrders = createAsyncThunk('orders/fetchOrders', async () => {
  return await fetchOrdersFromAPI();
  
});

// ✅ Define the state type


const initialState = {
  items: [], // Replace with your actual order type array if needed
  status: 'idle',
  error: null as string | null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Something went wrong';
      });
  },
});

export default orderSlice.reducer;
