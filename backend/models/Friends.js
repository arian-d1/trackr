import mongoose from "mongoose";

/*
const friendSchema = new mongoose.Schema({
  id: Number,
  friend_id_1: Number,
  friend_id_2: Number
});
*/

const friendSchema = new mongoose.Schema(
  {
    friend_id_1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    friend_id_2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "blocked"], default: "pending" },
  },
  { timestamps: true },
);

const Friend = mongoose.model("Friend", friendSchema);

export default Friend;
