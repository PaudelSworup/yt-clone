import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;

const ratingSchema = new mongoose.Schema({
  rating: {
    type: Number,
    require: true,
    trim: true,
  },

  video: {
    type: ObjectId,
    required: true,
    ref: "Video",
  },

  user: {
    type: ObjectId,
    required: true,
    ref: "User",
  },
});

export default mongoose.model("rating", ratingSchema);
