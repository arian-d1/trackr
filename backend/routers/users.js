import bcrypt from "bcryptjs";
import crypto from "crypto";
import express from "express";
import jwt from "jsonwebtoken";
import sharp from "sharp";
import { verifyJWT } from "../middleware/auth.js";
import User from "../models/Users.js";

const router = express.Router();

// Create or upsert user
router.post("/", async (req, res, next) => {
  try {
    const { username, email, displayName, privacy } = req.body;
    if (!username) return res.status(400).json({ error: "username required" });

    const update = {
      username,
      email,
      displayName,
    };
    if (privacy) {
      update.settings = { privacy: { visibility: privacy } };
    }

    const user = await User.findOneAndUpdate({ username }, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Register (username + optional password)
router.post("/register", async (req, res, next) => {
  try {
    const { username, password, email, displayName } = req.body;
    if (!username) return res.status(400).json({ error: "username required" });
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: "username taken" });
    let passwordHash;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }
    const user = await User.create({ username, email, displayName, passwordHash });
    
    // Generate session ID and add to user's sessions
    const sessionId = crypto.randomBytes(32).toString('hex');
    await User.updateOne({ _id: user._id }, { $push: { sessions: sessionId } });
    
    const token = jwt.sign({ userId: user._id, username: user.username, sessionId }, process.env.JWT_SECRET || "devsecret", { expiresIn: "365d" });
    res.json({ token, user: { username: user.username, displayName: user.displayName } });
  } catch (err) {
    next(err);
  }
});

// Login (username + optional password)
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username) return res.status(400).json({ error: "username required" });
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "invalid credentials" });
    if (user.passwordHash && password) {
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: "invalid credentials" });
    }
    
    // Generate session ID and add to user's sessions
    const sessionId = crypto.randomBytes(32).toString('hex');
    await User.updateOne({ _id: user._id }, { $push: { sessions: sessionId } });
    
    const token = jwt.sign({ userId: user._id, username: user.username, sessionId }, process.env.JWT_SECRET || "devsecret", { expiresIn: "365d" });
    res.json({ token, user: { username: user.username, displayName: user.displayName } });
  } catch (err) {
    next(err);
  }
});

// Get public user profile
router.get("/:username", async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).json({ error: "not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Get user profile for person profile page (public data only)
router.get("/profile/:username/public", async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("username displayName lastLocation")
      .lean();
    if (!user) return res.status(404).json({ error: "not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update settings
router.patch("/:username/settings", async (req, res, next) => {
  try {
    const { visibility } = req.body;
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      { $set: { "settings.privacy.visibility": visibility } },
      { new: true },
    );
    if (!user) return res.status(404).json({ error: "not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Generate invite code (invite_only)
router.post("/:username/invite", async (req, res, next) => {
  try {
    const code = crypto.randomBytes(6).toString("hex");
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      { inviteCode: code, "settings.privacy.visibility": "invite_only" },
      { new: true },
    );
    if (!user) return res.status(404).json({ error: "not found" });
    res.json({ inviteCode: code });
  } catch (err) {
    next(err);
  }
});

// Logout - remove session from user's sessions array
router.post("/logout", async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "missing token" });
    
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
    const { userId, sessionId } = payload;
    
    // Remove session from user's sessions array
    await User.updateOne(
      { _id: userId },
      { $pull: { sessions: sessionId } }
    );
    
    res.json({ success: true, message: "User logged out successfully" });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "invalid token" });
    }
    next(err);
  }
});

// Get user profile (for settings)
router.get("/profile/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .select("username displayName profilePicture settings.privacy.visibility")
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update user settings
router.put("/settings", verifyJWT, async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { privacy } = req.body;
    
    const updateData = {};
    if (privacy) {
      updateData.settings = { privacy };
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("username displayName profilePicture settings.privacy.visibility");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Upload profile picture
router.post("/profile-picture", verifyJWT, async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { profilePicture } = req.body;
    
    if (!profilePicture) {
      return res.status(400).json({ error: "Profile picture data required" });
    }
    
    // Validate base64 image (accept any image format)
    const base64Regex = /^data:image\/([a-zA-Z0-9]+);base64,/;
    if (!base64Regex.test(profilePicture)) {
      console.log("Invalid base64 format received:", profilePicture.substring(0, 100));
      console.log("Expected format: data:image/[format];base64,[data]");
      return res.status(400).json({ error: "Invalid image format. Please provide a valid image." });
    }
    
    // Extract image format for debugging
    const formatMatch = profilePicture.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
    const imageFormat = formatMatch ? formatMatch[1] : 'unknown';
    console.log("Received image format:", imageFormat);
    
    // Extract the base64 data (remove data:image/...;base64, prefix)
    const base64Data = profilePicture.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    let finalBase64;
    
    try {
      // Try to convert any image format to JPEG using sharp
      const convertedBuffer = await sharp(imageBuffer)
        .jpeg({ quality: 80 }) // Compress to 80% quality
        .resize(300, 300, { fit: 'cover' }) // Resize to 300x300 for consistency
        .toBuffer();
      
      // Convert back to base64 with JPEG data URI
      finalBase64 = `data:image/jpeg;base64,${convertedBuffer.toString('base64')}`;
    } catch (sharpError) {
      console.log("Sharp not available, using original image:", sharpError.message);
      // Fallback: use original image if sharp is not available
      finalBase64 = profilePicture;
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: finalBase64 },
      { new: true }
    ).select("username displayName profilePicture settings.privacy.visibility");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    console.error("Error processing profile picture:", err);
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('sharp')) {
      return res.status(500).json({ error: "Image processing service unavailable. Please try again later." });
    }
    res.status(500).json({ error: "Failed to process profile picture. Please try again." });
  }
});

export default router;


