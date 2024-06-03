import mongoose, { Schema } from "mongoose";

const playListSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Playlist name is required"],
    },
    description: {
      type: String,
      required: [true, "Playlist description is required"],
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const PlayList = mongoose.model("playlist", playListSchema);
