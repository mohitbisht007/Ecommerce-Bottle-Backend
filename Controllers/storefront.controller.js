import Banner from "../Schemas/banner.schema.js";
import Settings from "../Schemas/setting.schema.js";

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

export const updateBanner = async (req, res) => {
  try {
    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.json(updatedBanner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// --- SETTINGS METHODS (Announcement Bar) ---

const DEFAULT_ANNOUNCEMENT = {
  text: "Welcome to BottleShop!",
  messages: [
    "Free shipping on orders above Rs 999",
    "7 Day easy return",
    "10% Off On Orders Above Rs 1999",
  ],
  enabled: true,
  bgColor: "#ec4899",
  textColor: "#ffffff",
};

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne().lean();

    if (!settings) {
      return res.status(200).json({
        announcement: DEFAULT_ANNOUNCEMENT,
      });
    }

    const announcement = settings.announcement || {};
    const messages =
      Array.isArray(announcement.messages) && announcement.messages.length
        ? announcement.messages
        : announcement.text
          ? [announcement.text]
          : DEFAULT_ANNOUNCEMENT.messages;

    return res.status(200).json({
      ...settings,
      announcement: {
        ...DEFAULT_ANNOUNCEMENT,
        ...announcement,
        messages,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const incoming = req.body?.announcement;

    if (!incoming || typeof incoming !== "object") {
      return res.status(400).json({
        message: "Announcement settings are required",
      });
    }

    const messages = Array.isArray(incoming.messages)
      ? incoming.messages
          .map((message) => String(message).trim())
          .filter(Boolean)
      : incoming.text
        ? [String(incoming.text).trim()].filter(Boolean)
        : [];

    if (incoming.enabled && messages.length === 0) {
      return res.status(400).json({
        message: "Add at least one message or disable the announcement bar",
      });
    }

    const bgColor = /^#[0-9a-fA-F]{6}$/.test(incoming.bgColor || "")
      ? incoming.bgColor
      : DEFAULT_ANNOUNCEMENT.bgColor;

    const textColor = /^#[0-9a-fA-F]{6}$/.test(incoming.textColor || "")
      ? incoming.textColor
      : DEFAULT_ANNOUNCEMENT.textColor;

    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          announcement: {
            text: messages[0] || "",
            messages,
            enabled: incoming.enabled !== false,
            bgColor,
            textColor,
          },
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Announcement settings updated",
      settings: updatedSettings,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// --- WATCH & BUY ---

import WatchAndBuy from "../Schemas/watchAndBuy.schema.js";
import Product from "../Schemas/product.schema.js";

export const getAdminProductsList = async (req, res) => {
  try {
    const products = await Product.find({}, "_id title").sort({ title: 1 });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addReel = async (req, res) => {
  try {
    const { videoUrl, thumbnailUrl, linkedProduct, caption } = req.body;

    if (!videoUrl || !linkedProduct) {
      return res.status(400).json({
        success: false,
        message: "Video URL and Linked Product are required.",
      });
    }

    const newReel = await WatchAndBuy.create({
      videoUrl,
      thumbnailUrl,
      linkedProduct,
      caption,
    });

    res.status(201).json({
      success: true,
      message: "Reel added successfully to Watch & Buy inventory.",
      reel: newReel,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    res.status(200).json({
      success: true,
      message: "Reel removed from stream rotation.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
