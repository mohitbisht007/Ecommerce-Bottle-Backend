import User from "../Schemas/user.schema.js";
import Order from "../Schemas/order.schema.js";

/**
 * GET ALL CUSTOMERS
 * Admin only
 *
 * Supports:
 * ?search=mohit
 *
 * Returns customer summary information.
 */
export const getAllCustomersAdmin = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const searchRegex = search.trim()
      ? new RegExp(search.trim(), "i")
      : null;

    const userQuery = {
      role: "customer",
      ...(searchRegex && {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      }),
    };

    const customers = await User.find(userQuery)
      .select(
        "name email phone avatar authProvider isGuest createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const customerIds = customers.map((customer) => customer._id);

    /*
     * Get order statistics for all customers in one aggregation.
     */
    const orderStats =
      customerIds.length > 0
        ? await Order.aggregate([
            {
              $match: {
                user: { $in: customerIds },
                paymentStatus: "Paid",
              },
            },
            {
              $group: {
                _id: "$user",
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: "$totalAmount" },
                lastOrderDate: { $max: "$createdAt" },
              },
            },
          ])
        : [];

    const statsMap = new Map(
      orderStats.map((stat) => [
        stat._id.toString(),
        stat,
      ])
    );

    const formattedCustomers = customers.map((customer) => {
      const stats = statsMap.get(
        customer._id.toString()
      );

      return {
        ...customer,

        id: customer._id,

        totalOrders: stats?.totalOrders || 0,

        totalSpent: stats?.totalSpent || 0,

        lastOrderDate:
          stats?.lastOrderDate || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedCustomers.length,
      customers: formattedCustomers,
    });
  } catch (error) {
    console.error(
      "GET CUSTOMERS ADMIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customers",
    });
  }
};


/**
 * GET CUSTOMER BY ID
 * Admin only
 *
 * Returns complete customer information:
 * - Personal information
 * - Addresses (VIEW ONLY)
 * - Wishlist
 * - Order history
 * - Order summary
 * - Total spent
 */
export const getCustomerByIdAdmin = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findOne({
      _id: customerId,
      role: "customer",
    })
      .select(
        "name email phone avatar authProvider isGuest addresses wishlist createdAt"
      )
      .populate(
        "wishlist",
        "title slug images price"
      )
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /*
     * Get customer's complete order history.
     */
    const orders = await Order.find({
      user: customerId,
    })
      .select(
        "items shippingAddress totalAmount invoiceNumber invoiceDate invoicePath paymentMethod razorpayOrderId razorpayPaymentId paymentStatus orderStatus shiprocket createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    /*
     * Paid orders are used for actual customer spending.
     */
    const paidOrders = orders.filter(
      (order) =>
        order.paymentStatus === "Paid"
    );

    const totalSpent = paidOrders.reduce(
      (sum, order) =>
        sum + Number(order.totalAmount || 0),
      0
    );

    /*
     * Order statistics.
     */
    const orderSummary = {
      total: orders.length,

      paid: orders.filter(
        (order) =>
          order.paymentStatus === "Paid"
      ).length,

      pending: orders.filter(
        (order) =>
          order.paymentStatus === "Pending"
      ).length,

      failed: orders.filter(
        (order) =>
          order.paymentStatus === "Failed"
      ).length,

      processing: orders.filter(
        (order) =>
          order.orderStatus === "Processing"
      ).length,

      shipped: orders.filter(
        (order) =>
          order.orderStatus === "Shipped"
      ).length,

      delivered: orders.filter(
        (order) =>
          order.orderStatus === "Delivered"
      ).length,

      cancelled: orders.filter(
        (order) =>
          order.orderStatus === "Cancelled"
      ).length,
    };

    return res.status(200).json({
      success: true,

      customer: {
        ...customer,

        id: customer._id,

        totalOrders: paidOrders.length,

        totalSpent,

        orderSummary,

        /*
         * Addresses are intentionally returned
         * as read-only customer information.
         */
        addresses: customer.addresses || [],

        orders,
      },
    });
  } catch (error) {
    console.error(
      "GET CUSTOMER BY ID ADMIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch customer details",
    });
  }
};


/**
 * UPDATE CUSTOMER
 * Admin only
 *
 * Admin can update:
 * - Name
 * - Email
 * - Phone
 *
 * Admin cannot update:
 * - Password
 * - Addresses
 * - Wishlist
 * - Role
 * - Google ID
 * - Auth provider
 */
export const updateCustomerAdmin = async (req, res) => {
  try {
    const { customerId } = req.params;

    const {
      name,
      email,
      phone,
    } = req.body;

    const customer = await User.findOne({
      _id: customerId,
      role: "customer",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /*
     * Update email.
     */
    if (email !== undefined) {
      const normalizedEmail =
        email.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
          _id: { $ne: customerId },
        });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "Email is already registered to another account",
        });
      }

      customer.email = normalizedEmail;
    }

    /*
     * Update name.
     */
    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      customer.name = trimmedName;
    }

    /*
     * Update phone.
     */
    if (phone !== undefined) {
      customer.phone = phone.trim();
    }

    await customer.save();

    return res.status(200).json({
      success: true,

      message:
        "Customer information updated successfully",

      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar: customer.avatar,
        authProvider: customer.authProvider,
        isGuest: customer.isGuest,
        createdAt: customer.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE CUSTOMER ADMIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update customer information",
    });
  }
};