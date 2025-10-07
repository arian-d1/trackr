import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import Captured from "../models/Captured.js";
import User from "../models/Users.js";

const router = express.Router();

// Create a capture
router.post("/", verifyJWT, async (req, res, next) => {
  try {
    const { animal, photo, latitude, longitude, metadata } = req.body;
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ error: "user not found" });

    // Generate a random rating between 1-100 for the animal
    const rating = Math.floor(Math.random() * 100) + 1;

    const capture = await Captured.create({
      user_id: user._id,
      animal,
      photo,
      latitude,
      longitude,
      rating,
      metadata,
      capturedAt: new Date(),
    });

    // Update lastLocation
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLocation: { latitude, longitude, at: new Date() } } },
    );

    res.json(capture);
  } catch (err) {
    next(err);
  }
});

// List captures for user
router.get("/:username", async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "user not found" });
    const list = await Captured.find({ user_id: user._id })
      .sort({ capturedAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

export default router;


