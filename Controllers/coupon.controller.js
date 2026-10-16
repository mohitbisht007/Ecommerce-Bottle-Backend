import Coupon from "../Schemas/coupon.schema.js";
import { evaluateCoupon, getCartMetrics } from "../utils/couponLogic.js";

// CREATE COUPON
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumItems,
      minimumCartValue,
      maximumDiscount,
      usageLimit,
      perUserLimit,
      startDate,
      expiryDate,
      isActive,
      showOnCart,
    } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: "Code, discount type and discount value are required",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    const existingCoupon = await Coupon.findOne({
      code: normalizedCode,
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    if (Number(discountValue) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (
      discountType === "percentage" &&
      Number(discountValue) > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      description: description || "",
      discountType,
      discountValue: Number(discountValue),
      minimumItems: Number(minimumItems) || 1,
      minimumCartValue: Number(minimumCartValue) || 0,
      maximumDiscount:
        maximumDiscount === "" ||
          maximumDiscount === null ||
          maximumDiscount === undefined
          ? null
          : Number(maximumDiscount),
      usageLimit:
        usageLimit === "" ||
          usageLimit === null ||
          usageLimit === undefined
          ? null
          : Number(usageLimit),
      perUserLimit: Number(perUserLimit) || 1,
      startDate: startDate || new Date(),
      expiryDate: expiryDate || null,
      isActive: isActive !== false,
      showOnCart: showOnCart !== false,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("CREATE COUPON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET ALL COUPONS
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("GET COUPONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// UPDATE COUPON
export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const updates = { ...req.body };

    // Always normalize coupon code
    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }

    if (updates.showOnCart !== undefined) {
      updates.showOnCart = updates.showOnCart === true;
    }

    // Validate discount type
    if (
      updates.discountType &&
      !["percentage", "fixed"].includes(updates.discountType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    // Validate percentage
    if (
      updates.discountType === "percentage" &&
      Number(updates.discountValue) > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("UPDATE COUPON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// DELETE COUPON
export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findByIdAndDelete(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("DELETE COUPON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, items } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const coupon = await Coupon.findOne({
      code: String(code).trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive coupon",
      });
    }

    const result = evaluateCoupon(coupon, items);

    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    const { cartTotal } = getCartMetrics(items);

    return res.status(200).json({
      success: true,
      message: result.message,
      coupon: {
        code: coupon.code,
        description: coupon.description || "",
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumItems: coupon.minimumItems,
        minimumCartValue: coupon.minimumCartValue,
        maximumDiscount: coupon.maximumDiscount,
      },
      discount: result.discount,
      finalAmount: result.finalAmount,
      cartTotal,
    });
  } catch (error) {
    console.error("COUPON VALIDATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to validate coupon",
    });
  }
};

export const getStorefrontCoupons = async (req, res) => {
  try {
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      showOnCart: true,

      startDate: {
        $lte: now,
      },

      $and: [
        {
          $or: [
            { expiryDate: null },
            { expiryDate: { $gte: now } },
          ],
        },

        {
          $or: [
            { usageLimit: null },
            {
              $expr: {
                $lt: ["$usedCount", "$usageLimit"],
              },
            },
          ],
        },
      ],
    })
      .select(
        "code description discountType discountValue minimumItems minimumCartValue maximumDiscount usageLimit usedCount startDate expiryDate"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error(
      "GET STOREFRONT COUPONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch available coupons",
    });
  }
};