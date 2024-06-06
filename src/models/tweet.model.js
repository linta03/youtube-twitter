import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: [true, "Tweet content is required"],
    },
  },
  {
    timestamps: true,
  },
);


export const Tweet = mongoose.model("tweet", tweetSchema);
