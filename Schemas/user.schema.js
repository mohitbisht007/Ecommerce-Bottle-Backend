import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"], trim: true },
  email: { type: String, required: [true, "Email is required"], trim: true },
  number: { type: String, required: [true, "Phone number is required"] },
  street: { type: String, required: [true, "Address/Street is required"] },
  city: { type: String, required: [true, "City is required"] },
  state: { type: String, required: [true, "State is required"] },
  zip: { type: String, required: [true, "Zip code is required"] },
  landmark: { type: String, default: "" },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "Name is required"],
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    index: true,
  },

  phone: {
    type: String,
    default: "",
  },

  // Changed to optional to allow Google Users
  passwordHash: {
    type: String,
    required: function () {
      // Only required if not using Google login
      return this.authProvider === "local";
    },
  },

  // New fields for Google Integration
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows nulls for non-google users
  },

  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },

  avatar: { type: String, default: "" },

  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer",
  },

  isGuest: {
    type: Boolean,
    default: false,
  },

  addresses: [addressSchema],

  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
export default User;
