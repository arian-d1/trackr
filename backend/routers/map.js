import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import Captured from "../models/Captured.js";
import User from "../models/Users.js";

const router = express.Router();

// Recent animal captures within last 30 minutes
router.get("/recent", verifyJWT, async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const list = await Captured.find({ capturedAt: { $gte: since } })
      .populate("user_id", "username displayName")
      .sort({ capturedAt: -1 })
      .limit(500)
      .lean();
    
    // Format data for map display
    const formattedList = list.map(capture => ({
      _id: capture._id,
      animal: capture.animal,
      latitude: capture.latitude,
      longitude: capture.longitude,
      rating: capture.rating,
      foundBy: capture.user_id.displayName || capture.user_id.username,
      foundByUsername: capture.user_id.username,
      capturedAt: capture.capturedAt,
      photo: capture.photo
    }));
    
    res.json(formattedList);
  } catch (err) {
    next(err);
  }
});

// Get friends' last locations
router.get("/friends", verifyJWT, async (req, res, next) => {
  try {
    const currentUser = req.auth.userId;
    
    // Get user's friends
    const Friend = (await import("../models/Friends.js")).default;
    const friends = await Friend.find({
      $or: [
        { friend_id_1: currentUser },
        { friend_id_2: currentUser }
      ],
      status: "accepted"
    })
      .populate("friend_id_1", "username displayName lastLocation profilePicture settings.privacy.visibility")
      .populate("friend_id_2", "username displayName lastLocation profilePicture settings.privacy.visibility")
      .lean();
    
    // Format friend locations - only include friends who have public location settings
    const friendLocations = friends
      .filter(friendship => {
        const friend = friendship.friend_id_1._id.toString() === currentUser.toString() 
          ? friendship.friend_id_2 
          : friendship.friend_id_1;
        
        // Only show location if friend has public privacy settings
        return friend.settings?.privacy?.visibility === 'public' && friend.lastLocation;
      })
      .map(friendship => {
        const friend = friendship.friend_id_1._id.toString() === currentUser.toString() 
          ? friendship.friend_id_2 
          : friendship.friend_id_1;
        
        return {
          _id: friend._id,
        username: friend.username,
        displayName: friend.displayName || friend.username,
        latitude: friend.lastLocation?.latitude,
        longitude: friend.lastLocation?.longitude,
        lastSeen: friend.lastLocation?.at
      };
    }).filter(friend => friend.latitude && friend.longitude); // Only include friends with locations
    
    res.json(friendLocations);
  } catch (err) {
    next(err);
  }
});

// Friend last locations (always show last until next photo)
router.get("/friends/:username", verifyJWT, async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "not found" });
    // Use friends aggregation via Captured or store in Friend model if needed.
    // For simplicity, return user's own last location too
    res.json({ lastLocation: user.lastLocation });
  } catch (err) {
    next(err);
  }
});

export default router;


