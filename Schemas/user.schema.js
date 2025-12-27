import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  number: { type: String, required: [true, 'Phone number is required'] },
  street: { type: String, required: [true, 'Address/Street is required'] },
  city: { type: String, required: [true, 'City is required'] },
  state: { type: String, required: [true, 'State is required'] },
  zip: { type: String, required: [true, 'Zip code is required'] },
  landmark: { type: String, default: "" }, // Optional
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    index: true
  },

  phone: {
    type: String,
    default: ""
  },

  passwordHash: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },

  addresses: [addressSchema],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema)
export default User