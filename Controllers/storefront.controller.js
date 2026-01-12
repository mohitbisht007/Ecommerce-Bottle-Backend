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