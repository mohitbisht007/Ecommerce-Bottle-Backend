import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    // Kept for backwards compatibility with older admin data.
    text: {
      type: String,
      default: "Welcome to BottleShop!",
      trim: true,
    },
    messages: {
      type: [String],
      default: [
        "Free shipping on orders above Rs 999",
        "7 Day easy return",
        "10% Off On Orders Above Rs 1999",
      ],
    },
    enabled: { type: Boolean, default: true },
    bgColor: { type: String, default: "#ec4899" },
    textColor: { type: String, default: "#ffffff" },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    announcement: {
      type: announcementSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
