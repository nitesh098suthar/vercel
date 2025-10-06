"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../redux/features/orders/orderSlice";
import { AppDispatch, RootState } from "../redux/store";

interface Order {
  id: string;
  totalAmount: number;
  status: string;
}

const AllOrdersPage = () => {
  console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID);
  console.log("TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN);
  console.log(
    "TWILIO_VERIFY_SERVICE_ID:",
    process.env.TWILIO_VERIFY_SERVICE_ID
  );
  console.log("JWT_SECRET:", process.env.JWT_SECRET);
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  console.log("DIRECT_URL:", process.env.DIRECT_URL);
  console.log(
    "AMPLIFY_AWS_ACCESS_KEY_ID:",
    process.env.AMPLIFY_AWS_ACCESS_KEY_ID
  );
  console.log(
    "AMPLIFY_AWS_SECRET_ACCESS_KEY:",
    process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY
  );
  console.log("RAZORPAY_SECRET:", process.env.RAZORPAY_SECRET);
  console.log(
    "NEXT_PUBLIC_AMPLIFY_AWS_REGION:",
    process.env.NEXT_PUBLIC_AMPLIFY_AWS_REGION
  );
  console.log(
    "NEXT_PUBLIC_AMPLIFY_BUCKET:",
    process.env.NEXT_PUBLIC_AMPLIFY_BUCKET
  );
  console.log(
    "NEXT_PUBLIC_RAZORPAY_KEY_ID:",
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  );
  console.log("NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);
  console.log("Environment Variables End");
  const dispatch = useDispatch<AppDispatch>();
  const { items, status, error } = useSelector(
    (state: RootState) => state.orders
  );

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  if (status === "loading") return <p>Loading...</p>;
  if (status === "failed") return <p>Error: {error}</p>;

  return (
    <main className="p-6 bg-black min-h-screen">
      <h2 className="text-2xl font-bold text-black mb-6">All Orders</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((item: Order) => (
          <div
            key={item.id}
            className="mb-4 p-4 border rounded-md shadow-sm bg-gray"
          >
            <p>
              <strong>Order ID:</strong> {item.id ?? "N/A"}
            </p>
            <p>
              <strong>Total:</strong> ₹{item.totalAmount ?? 0}
            </p>
            <p>
              <strong>Status:</strong> {item.status ?? "N/A"}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
};

export default AllOrdersPage;
