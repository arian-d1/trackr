import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import Captured from "../models/Captured.js";
import User from "../models/Users.js";

const router = express.Router();

// Global leaderboard - all users by total captures
router.get("/", verifyJWT, async (req, res, next) => {
  try {
    const agg = await Captured.aggregate([
      { $group: { _id: "$user_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: User.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { 
        $project: { 
          username: "$user.username", 
          displayName: "$user.displayName", 
          profilePicture: "$user.profilePicture",
          count: 1
        } 
      },
    ]);
    
    // Add rank manually since MongoDB aggregation ranking is complex
    const result = agg.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Leaderboard by specific animal type
router.get("/:animalType", verifyJWT, async (req, res, next) => {
  try {
    const { animalType } = req.params;
    const agg = await Captured.aggregate([
      { $match: { animal: animalType } },
      { $group: { _id: "$user_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: User.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { 
        $project: { 
          username: "$user.username", 
          displayName: "$user.displayName", 
          profilePicture: "$user.profilePicture",
          count: 1,
          animalType: animalType
        } 
      },
    ]);
    
    // Add rank manually since MongoDB aggregation ranking is complex
    const result = agg.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get available animal types for tabs (only those with captures)
router.get("/animals/types", verifyJWT, async (req, res, next) => {
  try {
    const animals = await Captured.distinct("animal");
    res.json(animals);
  } catch (err) {
    next(err);
  }
});

// Get all possible animal types from configuration
router.get("/animals/all-types", verifyJWT, async (req, res, next) => {
  try {
    // Import the ALLOWED_ANIMALS from itt.js
    const { ALLOWED_ANIMALS } = await import("../itt.js");
    res.json(ALLOWED_ANIMALS);
  } catch (err) {
    next(err);
  }
});

export default router;


