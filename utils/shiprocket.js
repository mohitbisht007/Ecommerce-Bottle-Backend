const SHIPROCKET_AUTH_URL =
  "https://apiv2.shiprocket.in/v1/external/auth/login";

export const getShiprocketToken = async () => {
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

    if (!response.ok) {
      console.error("Shiprocket authentication failed:", data);
      throw new Error(
        data?.message || "Shiprocket authentication failed"
      );
    }

    return data.token;
  } catch (error) {
    console.error("Shiprocket Auth Error:", error.message);
    throw error;
  }
};