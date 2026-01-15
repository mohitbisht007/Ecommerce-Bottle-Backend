import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title: { 
    type: String, 
  },
  imageUrl: { 
    type: String, 
    required: true // The Cloudinary URL
  },
  link: { 
    type: String, 
    default: "/" // Where the user goes when they click the banner
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  order: { 
    type: Number, 
    default: 0 // To control which banner shows first
  }
}, { timestamps: true });

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;