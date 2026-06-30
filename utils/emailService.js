import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP VERIFY ERROR:", error);
  } else {
    console.log("SMTP Server is ready.");
  }
});

export const sendOrderEmail = async (email, order, status) => {
  console.log(order.items)
  const isSuccess = status === "success";

  const mailOptions = {
    from: `"Bouncy Bucket" <${process.env.EMAIL_USER}>`,
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
            <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 12px;">Need help? <a href="mailto:sales@bouncybucket.com" style="color: #0f172a; text-decoration: none; font-weight: bold;">Contact Support</a></p>
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


export const sendContactNotification = async (data) => {
  const mailOptions = {
    from: `"BouncyBucket Website" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // sales@bouncybucket.com
    replyTo: data.email,
    subject: `📩 New Contact Form Submission • ${data.subject}`,

    html: `
    <div style="background:#f8fafc;padding:40px 10px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

      <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 6px 18px rgba(0,0,0,.05);">

        <!-- Header -->
        <div style="background:#0f172a;padding:32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:26px;letter-spacing:3px;">
            BOUNCYBUCKET
          </h1>

          <p style="margin-top:10px;color:#94a3b8;font-size:13px;">
            Website Contact Form
          </p>
        </div>

        <!-- Body -->
        <div style="padding:35px;">

          <h2 style="margin-top:0;color:#0f172a;font-size:22px;">
            📩 New Customer Enquiry
          </h2>

          <p style="color:#475569;line-height:1.7;font-size:15px;">
            A visitor has submitted the contact form from
            <strong>bouncybucket.com</strong>.
          </p>

          <table
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="
              margin-top:30px;
              border-collapse:collapse;
              background:#f8fafc;
              border-radius:8px;
            "
          >

            <tr>
              <td style="padding:18px;border-bottom:1px solid #e2e8f0;width:180px;font-weight:bold;color:#334155;">
                Full Name
              </td>

              <td style="padding:18px;border-bottom:1px solid #e2e8f0;color:#0f172a;">
                ${data.name}
              </td>
            </tr>

            <tr>
              <td style="padding:18px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#334155;">
                Email
              </td>

              <td style="padding:18px;border-bottom:1px solid #e2e8f0;">
                <a href="mailto:${data.email}"
                   style="color:#2563eb;text-decoration:none;">
                  ${data.email}
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:18px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#334155;">
                Phone
              </td>

              <td style="padding:18px;border-bottom:1px solid #e2e8f0;color:#0f172a;">
                ${data.phone || "Not Provided"}
              </td>
            </tr>

            <tr>
              <td style="padding:18px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#334155;">
                Subject
              </td>

              <td style="padding:18px;border-bottom:1px solid #e2e8f0;color:#0f172a;">
                ${data.subject}
              </td>
            </tr>

          </table>

          <div
            style="
              margin-top:35px;
              background:#ffffff;
              border:1px solid #e2e8f0;
              border-left:5px solid #ec4899;
              padding:24px;
              border-radius:8px;
            "
          >

            <p
              style="
                margin:0;
                color:#64748b;
                font-size:13px;
                text-transform:uppercase;
                letter-spacing:1px;
              "
            >
              Customer Message
            </p>

            <p
              style="
                margin-top:15px;
                white-space:pre-line;
                line-height:1.8;
                color:#0f172a;
                font-size:15px;
              "
            >
              ${data.message}
            </p>

          </div>

          <div style="margin-top:35px;text-align:center;">

            <a
              href="mailto:${data.email}"
              style="
                display:inline-block;
                background:#0f172a;
                color:white;
                padding:14px 30px;
                border-radius:6px;
                text-decoration:none;
                font-weight:bold;
              "
            >
              Reply to Customer
            </a>

          </div>

        </div>

        <!-- Footer -->
        <div
          style="
            background:#f8fafc;
            border-top:1px solid #e2e8f0;
            padding:25px;
            text-align:center;
          "
        >

          <p style="margin:0;color:#94a3b8;font-size:12px;">
            This email was automatically generated from the
            BouncyBucket Contact Form.
          </p>

          <p style="margin-top:10px;color:#94a3b8;font-size:12px;">
            © ${new Date().getFullYear()} BouncyBucket. All Rights Reserved.
          </p>

        </div>

      </div>

    </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};


export const sendContactAutoReply = async (data) => {
  const mailOptions = {
    from: `"BouncyBucket" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: "We've Received Your Message • BouncyBucket",

    html: `
    <div style="background:#f8fafc;padding:40px 10px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

      <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 6px 18px rgba(0,0,0,.05);">

        <!-- Header -->
        <div style="background:#0f172a;padding:35px;text-align:center;">

          <h1 style="
            margin:0;
            color:#ffffff;
            font-size:28px;
            letter-spacing:4px;
            text-transform:uppercase;
          ">
            BouncyBucket
          </h1>

          <p style="
            margin-top:12px;
            color:#94a3b8;
            font-size:14px;
          ">
            Premium Hydration. Premium Support.
          </p>

        </div>

        <!-- Success Banner -->
        <div style="
          background:#ecfdf5;
          border-bottom:1px solid #d1fae5;
          padding:20px;
          text-align:center;
        ">

          <div style="
            width:60px;
            height:60px;
            background:#10b981;
            border-radius:50%;
            margin:auto;
            line-height:60px;
            font-size:30px;
            color:white;
            font-weight:bold;
          ">
            ✓
          </div>

          <h2 style="
            color:#065f46;
            margin:20px 0 8px;
            font-size:24px;
          ">
            Message Received
          </h2>

          <p style="
            color:#047857;
            margin:0;
            font-size:15px;
          ">
            Thank you for contacting BouncyBucket.
          </p>

        </div>

        <!-- Main Content -->
        <div style="padding:40px;">

          <p style="
            color:#0f172a;
            font-size:18px;
            margin-top:0;
          ">
            Hi <strong>${data.name}</strong>,
          </p>

          <p style="
            color:#475569;
            line-height:1.8;
            font-size:15px;
          ">
            Thank you for reaching out to us.
            This is an automated confirmation that we've successfully received your enquiry.
          </p>

          <div style="
            margin:35px 0;
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:8px;
            padding:25px;
          ">

            <p style="
              margin:0;
              color:#64748b;
              text-transform:uppercase;
              font-size:12px;
              letter-spacing:1px;
            ">
              Your Enquiry
            </p>

            <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">

              <tr>
                <td style="padding:8px 0;color:#64748b;width:120px;">
                  Subject
                </td>

                <td style="padding:8px 0;color:#0f172a;font-weight:bold;">
                  ${data.subject}
                </td>
              </tr>

              <tr>
                <td style="padding:8px 0;color:#64748b;">
                  Email
                </td>

                <td style="padding:8px 0;color:#0f172a;">
                  ${data.email}
                </td>
              </tr>

            </table>

          </div>

          <div style="
            background:#fff7ed;
            border-left:4px solid #f97316;
            padding:22px;
            border-radius:6px;
          ">

            <h3 style="
              margin-top:0;
              color:#9a3412;
            ">
              What Happens Next?
            </h3>

            <ul style="
              margin:15px 0 0;
              padding-left:20px;
              color:#7c2d12;
              line-height:1.9;
            ">

              <li>Our support team will review your enquiry.</li>

              <li>We'll respond within <strong>24 business hours.</strong></li>

              <li>If your request is urgent, simply reply to this email.</li>

            </ul>

          </div>

          <div style="
            margin-top:35px;
            text-align:center;
          ">

            <a
              href="https://bouncybucket.com"
              style="
                display:inline-block;
                background:#0f172a;
                color:#ffffff;
                text-decoration:none;
                padding:15px 34px;
                border-radius:6px;
                font-weight:bold;
              "
            >
              Visit Our Store
            </a>

          </div>

        </div>

        <!-- Footer -->
        <div style="
          background:#f8fafc;
          border-top:1px solid #e2e8f0;
          padding:30px;
          text-align:center;
        ">

          <p style="
            margin:0;
            color:#475569;
            font-size:14px;
          ">
            Need immediate assistance?
          </p>

          <p style="
            margin:10px 0 0;
            font-size:14px;
          ">
            📧
            <a
              href="mailto:sales@bouncybucket.com"
              style="
                color:#0f172a;
                text-decoration:none;
                font-weight:bold;
              "
            >
              sales@bouncybucket.com
            </a>
          </p>

          <p style="
            margin-top:25px;
            color:#94a3b8;
            font-size:12px;
          ">
            © ${new Date().getFullYear()} BouncyBucket.
            All Rights Reserved.
          </p>

        </div>

      </div>

    </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};