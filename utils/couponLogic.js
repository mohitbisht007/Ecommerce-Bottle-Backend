export function getCartMetrics(items = []) {
  const list = Array.isArray(items) ? items : [];

  const totalItems = list.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const cartTotal = list.reduce(
    (total, item) =>
      total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return {
    totalItems,
    cartTotal: Math.round(cartTotal * 100) / 100,
  };
}

export function calculateCouponDiscount(coupon, cartTotal) {
  const total = Number(cartTotal || 0);
  let discount = 0;

  if (!coupon || total <= 0) return 0;

  if (coupon.discountType === "percentage") {
    discount = (total * Number(coupon.discountValue || 0)) / 100;

    if (
      coupon.maximumDiscount !== null &&
      coupon.maximumDiscount !== undefined &&
      discount > Number(coupon.maximumDiscount)
    ) {
      discount = Number(coupon.maximumDiscount);
    }
  } else {
    discount = Number(coupon.discountValue || 0);
  }

  discount = Math.min(discount, total);
  return Math.round(discount * 100) / 100;
}

export function evaluateCoupon(coupon, items = [], now = new Date()) {
  if (!coupon) {
    return { ok: false, message: "Invalid or inactive coupon" };
  }

  if (!coupon.isActive) {
    return { ok: false, message: "Invalid or inactive coupon" };
  }

  if (coupon.startDate && now < new Date(coupon.startDate)) {
    return { ok: false, message: "This coupon is not active yet" };
  }

  if (coupon.expiryDate && now > new Date(coupon.expiryDate)) {
    return { ok: false, message: "This coupon has expired" };
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)
  ) {
    return { ok: false, message: "This coupon has reached its usage limit" };
  }

  const { totalItems, cartTotal } = getCartMetrics(items);

  if (totalItems < Number(coupon.minimumItems || 1)) {
    return {
      ok: false,
      message: `Add at least ${coupon.minimumItems} bottles to use this coupon`,
    };
  }

  if (cartTotal < Number(coupon.minimumCartValue || 0)) {
    return {
      ok: false,
      message: `Minimum cart value of ₹${coupon.minimumCartValue} required`,
    };
  }

  const discount = calculateCouponDiscount(coupon, cartTotal);

  return {
    ok: true,
    message: "Coupon applied successfully",
    discount,
    finalAmount: Math.round((cartTotal - discount) * 100) / 100,
    cartTotal,
    totalItems,
  };
}
