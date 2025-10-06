// redux/features/orders/orderAPI.ts

import httpClient from "@/lib/http-client";

export const fetchOrdersFromAPI = async () => {
  try {
    const response = await httpClient.get("/order/get");
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders");
  }
};
