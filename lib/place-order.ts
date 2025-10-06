import { prisma } from "@/lib/prisma";

interface OrderDetails {
  userId: string;
  fullName: string;
  mobile: string;
  alternativeMobile: string;
  email: string;
  address1: string;
  address2: string;
  landmark: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  paymentMethod: "COD" | "ONLINE";
  paid: boolean;
}

export async function placeOrder(details: OrderDetails) {
  const {
    userId,
    fullName,
    mobile,
    alternativeMobile,
    email,
    address1,
    address2,
    landmark,
    city,
    state,
    pinCode,
    country,
    paymentMethod,
    paid,
  } = details;

  // 1. Get user's cart items
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { item: true },
  });

  if (cartItems.length === 0) {
    throw new Error("No items in cart");
  }

  // 2. Create shipping address
  const shippingAddress = await prisma.shippingAddressForm.create({
    data: {
      fullName,
      mobile,
      alternativeMobile,
      email,
      address1,
      address2,
      landmark,
      city,
      state,
      pinCode,
      country,
    },
  });

  // 3. Calculate total
  const totalAmount = cartItems.reduce(
    (total, cartItem) => total + cartItem.item.price * cartItem.quantity,
    0
  );

  // 4. Create Order
  const order = await prisma.order.create({
    data: {
      userId,
      shippingAddressFormId: shippingAddress.id,
      totalAmount,
      paymentMethod,
      paid,
      items: {
        create: cartItems.map((cartItem) => ({
          itemId: cartItem.itemId,
          quantity: cartItem.quantity,
          totalPrice: cartItem.item.price * cartItem.quantity,
        })),
      },
    },
    include: {
      items: true,
      shippingAddressForm: true,
    },
  });

  // 5. Clear cart
  await prisma.cartItem.deleteMany({ where: { userId } });

  return order;
}
