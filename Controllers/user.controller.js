import User from "../Schemas/user.schema.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const signToken = (user) => {
  const payload = { id: user._id.toString(), role: user.role };
  const secret = process.env.JWT_SECRET;
  const opts = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
  return jwt.sign(payload, secret, opts);
};

/**
 * Helper: sanitize user object returned to client
 */
const safeUser = (userDoc) => {
  if (!userDoc) return null;
  const { _id, name, email, role, addresses, createdAt } = userDoc;
  return { id: _id.toString(), name, email, role, addresses, createdAt };
};


export const registerUser = async (req, res) => {
    try {
        const { name = '', email = '', password = '' } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const cleanEmail = String(email).trim().toLowerCase();

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        // Check if user exists
        const existing = await User.findOne({ email: cleanEmail });

        if (existing) return res.status(409).json({ message: 'Email already in use' });

        // Hash password
        const salt = await bcrypt.genSalt(10);

        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: cleanEmail,
            passwordHash,
            role: 'customer' // default explicit
        });

        const token = signToken(user);

        return res.status(201).json({
            user: safeUser(user),
            token
        });
    } catch (err) {
        return res.status(400).json(err.message)
    }
};

export const loginUser = async (req, res) => {
    try {
    const { email = '', password = '' } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return res.status(400).json({ message: 'Invalid Password' });

    const token = signToken(user);

    return res.json({
      user: safeUser(user),
      token
    });
  } catch (err) {
    return res.status(400).json(err.message)
  }
}


export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
        createdAt: user.createdAt,
        phone: user.phone || ""
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/user/update-profile
 * Update name / phone of logged-in user
 */
export const updateMyProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
        createdAt: user.createdAt,
        phone: user.phone || ""
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If this is the new default, unset other defaults
    if (req.body.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // If it's the very first address, make it default automatically
    if (user.addresses.length === 0) {
      req.body.isDefault = true;
    }

    user.addresses.push(req.body); // req.body contains name, number, street, etc.
    await user.save();

    res.status(200).json({ message: "Address added", addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * DELETE /api/remove-address/:addressId
 */
export const removeAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ 
      message: "Address removed successfully", 
      addresses: user.addresses 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/edit-address/:addressId
 */
export const editAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updateData = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find the specific address in the sub-document array
    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    // If setting as default, unset others
    if (updateData.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Update fields
    Object.assign(address, updateData);

    await user.save();

    res.status(200).json({ 
      message: "Address updated successfully", 
      addresses: user.addresses 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};