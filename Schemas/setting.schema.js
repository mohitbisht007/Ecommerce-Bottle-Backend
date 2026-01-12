import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  announcement: {
    text: { type: String, default: "Welcome to BottleShop!" },
    enabled: { type: Boolean, default: true },
    bgColor: { type: String, default: "#ec4899" },
    textColor: { type: String, default: "#ffffff" }
  }
}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);