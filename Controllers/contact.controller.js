import {
  sendContactNotification,
  sendContactAutoReply,
} from "../utils/emailService.js";

export const contactUs = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
    } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const data = {
      name,
      email,
      phone,
      subject,
      message,
    };

    // Send notification to admin
    await sendContactNotification(data);

    // Send auto reply
    await sendContactAutoReply(data);

    res.status(200).json({
      success: true,
      message: "Message sent successfully.",
    });

  } catch (err) {
    console.error("CONTACT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};