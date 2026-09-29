import Coupon from "../Schemas/coupon.schema.js";

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
    const { code, items, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive coupon",
      });
    }

    // Check start date
    if (coupon.startDate && new Date() < coupon.startDate) {
      return res.status(400).json({
        success: false,
        message: "This coupon is not active yet",
      });
    }

    // Check expiry
    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired",
      });
    }

    // Check total usage limit
    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its usage limit",
      });
    }

    // Count total number of bottles/items
    const totalItems = Array.isArray(items)
      ? items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      )
      : 0;

    // Minimum number of items
    if (totalItems < coupon.minimumItems) {
      return res.status(400).json({
        success: false,
        message: `Add at least ${coupon.minimumItems} bottles to use this coupon`,
      });
    }

    // Minimum cart value
    if (Number(cartTotal) < coupon.minimumCartValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum cart value of ₹${coupon.minimumCartValue} required`,
      });
    }

    // Calculate discount
    let discount = 0;

    if (coupon.discountType === "percentage") {
      discount = (Number(cartTotal) * coupon.discountValue) / 100;

      if (
        coupon.maximumDiscount !== null &&
        discount > coupon.maximumDiscount
      ) {
        discount = coupon.maximumDiscount;
      }
    }

    if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    // Never allow discount to exceed cart value
    discount = Math.min(discount, Number(cartTotal));

    const finalAmount = Number(cartTotal) - discount;

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumItems: coupon.minimumItems,
        minimumCartValue: coupon.minimumCartValue,
        maximumDiscount: coupon.maximumDiscount,
      },
      discount,
      finalAmount,
    });
  } catch (error) {
    console.error("COUPON VALIDATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to validate coupon",
    });
  }
};