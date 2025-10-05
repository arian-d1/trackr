import mongoose from "mongoose";

/*
const friendSchema = new mongoose.Schema({
  id: Number,
  friend_id_1: Number,
  friend_id_2: Number
});
*/

const friendSchema = new mongoose.Schema({
  friend_id_1: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  friend_id_2: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Friend = mongoose.model("Friend", friendSchema);

export default Friend;
