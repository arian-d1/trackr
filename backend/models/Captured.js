import mongoose from "mongoose";

const capturedSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    animal: { type: String, index: true, required: true },
    photo: String, // could be URL or base64
    longitude: Number,
    latitude: Number,
    rating: { 
      type: Number, 
      min: 1, 
      max: 100, 
      default: 50 
    }, // Pokemon-style rating for future fighting system
    metadata: {
      deviceModel: String,
      platform: String,
      osVersion: String,
      accuracyMeters: Number,
    },
    capturedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Captured = mongoose.model("Captured", capturedSchema);

export default Captured;
