import express from "express";
import { verifyJWT } from "../middleware/auth.js";
import Friend from "../models/Friends.js";
import User from "../models/Users.js";

const router = express.Router();

// Search users by name (for adding friends)
router.get("/search", verifyJWT, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);
    
    // Show all users (public, private, and invite-only)
    const users = await User.find({ 
      username: { $regex: q, $options: "i" }
    })
      .select("username displayName settings.privacy.visibility inviteCode profilePicture")
      .limit(20)
      .lean();
    
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// Send friend request
router.post("/request", verifyJWT, async (req, res, next) => {
  try {
    const { toUsername, inviteCode } = req.body;
    const from = await User.findById(req.auth.userId);
    const to = await User.findOne({ username: toUsername });
    if (!from || !to) return res.status(404).json({ error: "user not found" });

    // Private accounts can still receive friend requests
    // Only check for invite-only accounts that require invite codes
    if (to.settings.privacy.visibility === "invite_only" && !inviteCode) {
      return res.status(403).json({ error: "This user requires an invite code to add as a friend" });
    }

    // Invite code auto-accept
    const shouldAutoAccept = inviteCode && to.inviteCode === inviteCode;

    const existing = await Friend.findOne({
      $or: [
        { friend_id_1: from._id, friend_id_2: to._id },
        { friend_id_1: to._id, friend_id_2: from._id },
      ],
    });
    if (existing) {
      return res.status(409).json({ error: "Friend request already exists" });
    }

    const status = shouldAutoAccept ? "accepted" : "pending";
    const fr = await Friend.create({
      friend_id_1: from._id,
      friend_id_2: to._id,
      status,
    });
    res.json(fr);
  } catch (err) {
    next(err);
  }
});

// Accept request
router.post("/accept", verifyJWT, async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const currentUser = req.auth.userId;
    
    const fr = await Friend.findOneAndUpdate(
      {
        _id: requestId,
        friend_id_2: currentUser, // Only the recipient can accept
        status: "pending"
      },
      { status: "accepted" },
      { new: true }
    );
    if (!fr) return res.status(404).json({ error: "request not found" });
    res.json(fr);
  } catch (err) {
    next(err);
  }
});

// Deny request
router.post("/deny", verifyJWT, async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const currentUser = req.auth.userId;
    
    const fr = await Friend.findOneAndUpdate(
      {
        _id: requestId,
        friend_id_2: currentUser, // Only the recipient can deny
        status: "pending"
      },
      { status: "blocked" },
      { new: true }
    );
    if (!fr) return res.status(404).json({ error: "request not found" });
    res.json(fr);
  } catch (err) {
    next(err);
  }
});

// Get pending friend requests for current user
router.get("/requests/pending", verifyJWT, async (req, res, next) => {
  try {
    const currentUser = req.auth.userId;
    
    const requests = await Friend.find({
      friend_id_2: currentUser,
      status: "pending"
    })
      .populate("friend_id_1", "username displayName profilePicture")
      .lean();
    
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Get sent friend requests by current user
router.get("/requests/sent", verifyJWT, async (req, res, next) => {
  try {
    const currentUser = req.auth.userId;
    
    const requests = await Friend.find({
      friend_id_1: currentUser,
      status: "pending"
    })
      .populate("friend_id_2", "username displayName profilePicture")
      .lean();
    
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// Cancel/delete a friend request
router.delete("/requests/:requestId", verifyJWT, async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const currentUser = req.auth.userId;
    
    // Find the request and verify the current user is the sender
    const request = await Friend.findOne({
      _id: requestId,
      friend_id_1: currentUser,
      status: "pending"
    });
    
    if (!request) {
      return res.status(404).json({ error: "Friend request not found" });
    }
    
    // Delete the request
    await Friend.findByIdAndDelete(requestId);
    
    res.json({ message: "Friend request cancelled" });
  } catch (err) {
    next(err);
  }
});

// Remove friend
router.delete("/remove", verifyJWT, async (req, res, next) => {
  try {
    const { username } = req.body;
    const currentUser = req.auth.userId;
    
    // Find the user to remove
    const userToRemove = await User.findOne({ username });
    if (!userToRemove) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Find and delete the friendship
    const friendship = await Friend.findOneAndDelete({
      status: "accepted",
      $or: [
        { friend_id_1: currentUser, friend_id_2: userToRemove._id },
        { friend_id_1: userToRemove._id, friend_id_2: currentUser }
      ]
    });
    
    if (!friendship) {
      return res.status(404).json({ error: "Friendship not found" });
    }
    
    res.json({ success: true, message: "Friend removed successfully" });
  } catch (err) {
    next(err);
  }
});

// List friends
router.get("/:username", async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "not found" });
    const list = await Friend.find({
      status: "accepted",
      $or: [{ friend_id_1: user._id }, { friend_id_2: user._id }],
    })
      .populate("friend_id_1", "username displayName lastLocation profilePicture")
      .populate("friend_id_2", "username displayName lastLocation profilePicture")
      .lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

export default router;


