import Banner from "../Schemas/banner.schema.js";
import Settings from "../Schemas/setting.schema.js"

// --- BANNER METHODS ---

export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addBanner = async (req, res) => {
  try {
    const newBanner = new Banner(req.body);
    const saved = await newBanner.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: "Banner removed" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// --- SETTINGS METHODS (Announcement Bar) ---

// Note: Usually we store settings in a "Settings" collection with a fixed ID
export const updateAnnouncement = async (req, res) => {
    try {
        // Example: logic to update a single settings document in your DB
        res.json({ message: "Announcement updated" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// GET /api/storefront/settings
export const getSettings = async (req, res) => {
  try {
    // We look for the first document. If none exists, we return a default object.
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Return default structure if DB is empty
      return res.json({
        announcement: {
          text: "Welcome to our store!",
          enabled: true,
          bgColor: "#ec4899",
          textColor: "#ffffff"
        }
      });
    }
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/storefront/settings
export const updateSettings = async (req, res) => {
  try {
    // { upsert: true } means: "If it exists, update it. If not, create it."
    const updatedSettings = await Settings.findOneAndUpdate(
      {}, 
      req.body, 
      { new: true, upsert: true }
    );
    
    res.json(updatedSettings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

import WatchAndBuy from "../Schemas/watchAndBuy.schema.js";
import Product from "../Schemas/product.schema.js";

// --- FOR ADMINS: Fetch brief list of all products to fill the select dropdown ---
export const getAdminProductsList = async (req, res) => {
  try {
    // Only fetch ID and Title to keep the load minimal
    const products = await Product.find({}, "_id title").sort({ title: 1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- FOR ADMINS: Create a new Watch & Buy Reel Node ---
export const addReel = async (req, res) => {
  try {
    const { videoUrl, thumbnailUrl, linkedProduct, caption } = req.body;

    if (!videoUrl || !linkedProduct) {
      return res.status(400).json({ success: false, message: "Video URL and Linked Product are required." });
    }

    const newReel = await WatchAndBuy.create({
      videoUrl,
      thumbnailUrl,
      linkedProduct,
      caption
    });

    res.status(201).json({
      success: true,
      message: "Reel added successfully to Watch & Buy inventory.",
      reel: newReel
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- GLOBAL: Fetch all reels for the storefront landing stream ---
export const getActiveReelsStream = async (req, res) => {
  try {
    const reels = await WatchAndBuy.find()
      .populate("linkedProduct", "title price rating reviewsCount thumbnail image variants")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reels.length, reels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteReel = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await WatchAndBuy.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Reel not found." });
    }
    
    res.status(200).json({ success: true, message: "Reel removed from stream rotation." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};