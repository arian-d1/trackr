import mongoose from "mongoose";

const privacySettingsSchema = new mongoose.Schema(
  {
    visibility: {
      type: String,
      enum: ["public", "private", "invite_only"],
      default: "public",
    },
  },
  { _id: false },
);

const lastLocationSchema = new mongoose.Schema(
  {
    latitude: Number,
    longitude: Number,
    at: { type: Date },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, index: true, unique: true },
    email: { type: String, index: true, sparse: true },
    displayName: { type: String },
    profilePicture: { type: String }, // Base64 encoded profile picture
    passwordHash: { type: String }, // if using password auth later
    sessions: { type: [String], default: [] }, // Array of active session IDs
    settings: {
      privacy: { type: privacySettingsSchema, default: () => ({}) },
    },
    lastLocation: { type: lastLocationSchema },
    inviteCode: { type: String, index: true, sparse: true },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
