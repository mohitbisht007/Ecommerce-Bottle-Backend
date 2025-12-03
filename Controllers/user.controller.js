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