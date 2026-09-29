let shiprocketToken = null;
let tokenExpiresAt = 0;

const SHIPROCKET_AUTH_URL =
  "https://apiv2.shiprocket.in/v1/external/auth/login";

export const getShiprocketToken = async () => {
  // Reuse existing token if it is still valid
  if (shiprocketToken && Date.now() < tokenExpiresAt) {
    return shiprocketToken;
  }

  try {
    const response = await fetch(SHIPROCKET_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.token) {
      console.error("Shiprocket authentication failed:", data);

      throw new Error(
        data?.message || "Shiprocket authentication failed"
      );
    }

    shiprocketToken = data.token;

    // Shiprocket token is valid for 10 days.
    // Refresh slightly early to avoid edge-case expiry.
    tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;

    return shiprocketToken;
  } catch (error) {
    console.error("Shiprocket Auth Error:", error.message);
    throw error;
  }
};


export const createShiprocketOrder = async ({
  order,
  channelOrderId,
}) => {
  try {
    const token = await getShiprocketToken();

    const payload = {
      order_id: channelOrderId,
      order_date: new Date(order.createdAt).toISOString(),
      pickup_location: "Primary",

      billing_customer_name: order.shippingAddress.name,
      billing_last_name: "",
      billing_address: order.shippingAddress.street,
      billing_address_2: "",
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.zip,
      billing_state: order.shippingAddress.state,
      billing_country: "India",
      billing_email: order.shippingAddress.email,
      billing_phone: order.shippingAddress.number,

      shipping_is_billing: true,

      order_items: order.items.map((item) => ({
        name: item.title || item.name || "Product",
        sku: item.sku || item._id || `BB-${item.productId || "ITEM"}`,
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0,
        hsn: "",
      })),

      payment_method: "Prepaid",

      sub_total: order.totalAmount,

      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    const response = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Shiprocket order creation failed:", data);

      throw new Error(
        data?.message || "Failed to create Shiprocket order"
      );
    }

    return data;
  } catch (error) {
    console.error("Shiprocket Create Order Error:", error.message);
    throw error;
  }
};

export const createTestShiprocketShipment = async (order) => {
  const testId = Date.now();

  return {
    orderId: `TEST-SR-${testId}`,
    shipmentId: `TEST-SHIP-${testId}`,
    awbCode: `TEST-AWB-${testId}`,
    courierName: "Test Courier",
    status: "Processing",
    trackingUrl: "",
    lastUpdatedAt: new Date(),
  };
};