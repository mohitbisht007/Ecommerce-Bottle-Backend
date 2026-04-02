import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOrderEmail = async (email, order, status) => {
  const isSuccess = status === "success";

  const mailOptions = {
    from: `"Bouncy Bucket Luxury" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: isSuccess ? `Order Confirmed: #${order.razorpayOrderId}` : "Payment Action Required - Bouncy Bucket",
    html: isSuccess ? `
      <div style="background-color: #f8fafc; padding: 40px 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          
          <div style="background-color: #0f172a; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; letter-spacing: 4px; font-size: 24px; text-transform: uppercase;">Bouncy Bucket</h1>
            <p style="color: #94a3b8; margin-top: 10px; font-size: 14px;">Luxury Hydration Delivered</p>
          </div>

          <div style="padding: 40px;">
            <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Thank you for your order, ${order.shippingAddress.name}!</h2>
            <p style="color: #475569; line-height: 1.6;">We've received your payment and our team is already preparing your package for shipment. You'll receive another update once your items are on the way.</p>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 6px; margin: 30px 0;">
              <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
              <p style="margin: 5px 0 0 0; color: #0f172a; font-weight: bold; font-size: 16px;">#${order.razorpayOrderId}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="border-bottom: 2px solid #f1f5f9;">
                  <th style="text-align: left; padding: 10px 0; color: #64748b; font-size: 13px;">Item</th>
                  <th style="text-align: center; padding: 10px 0; color: #64748b; font-size: 13px;">Qty</th>
                  <th style="text-align: right; padding: 10px 0; color: #64748b; font-size: 13px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 15px 0; color: #0f172a; font-size: 14px;">${item.title}</td>
                    <td style="padding: 15px 0; text-align: center; color: #475569; font-size: 14px;">${item.quantity}</td>
                    <td style="padding: 15px 0; text-align: right; color: #0f172a; font-size: 14px;">₹${item.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="border-top: 2px solid #0f172a; padding-top: 20px; text-align: right;">
              <p style="margin: 0; color: #64748b;">Total Amount Paid</p>
              <h2 style="margin: 5px 0 0 0; color: #0f172a;">₹${order.totalAmount}</h2>
            </div>

            <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #0f172a;">Shipping Address</h4>
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                ${order.shippingAddress.street}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}
              </p>
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">Bouncy Bucket is a registered trademark of Keen Services.</p>
            <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 12px;">Need help? <a href="mailto:support@bouncybucket.com" style="color: #0f172a; text-decoration: none; font-weight: bold;">Contact Support</a></p>
          </div>
        </div>
      </div>
    ` : `
      <div style="background-color: #fef2f2; padding: 40px 10px; font-family: sans-serif; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; border: 1px solid #fee2e2;">
          <h2 style="color: #991b1b; margin-top: 0;">Payment Unsuccessful</h2>
          <p style="color: #7f1d1d;">We couldn't process the payment for your order. Don't worry, your selection is still reserved.</p>
          <a href="https://bouncybucket.com/checkout" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">Complete Your Purchase</a>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};