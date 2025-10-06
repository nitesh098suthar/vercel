import Link from "next/link";
import React from "react";

const page = () => {
  // Server-only variables
  const serverVars = {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_VERIFY_SERVICE_ID: process.env.TWILIO_VERIFY_SERVICE_ID,
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AMPLIFY_AWS_ACCESS_KEY_ID: process.env.AMPLIFY_AWS_ACCESS_KEY_ID,
    AMPLIFY_AWS_SECRET_ACCESS_KEY: process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY,
    RAZORPAY_SECRET: process.env.RAZORPAY_SECRET,
  };

  // Frontend-safe variables
  const publicVars = {
    NEXT_PUBLIC_AMPLIFY_AWS_REGION: process.env.NEXT_PUBLIC_AMPLIFY_AWS_REGION,
    NEXT_PUBLIC_AMPLIFY_BUCKET: process.env.NEXT_PUBLIC_AMPLIFY_BUCKET,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  };

  // Combine all variables
  const allVars = { ...serverVars, ...publicVars };

  return (
    <div>
      <Link href={"/all-orders"}>All Orders</Link>
      <p style={{ whiteSpace: "pre-wrap", marginTop: "20px" }}>
        {Object.entries(allVars)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")}
      </p>
    </div>
  );
};

export default page;
