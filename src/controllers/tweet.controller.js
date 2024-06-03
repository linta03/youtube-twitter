import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req?.body;
  const userId = req?.user?._id;

  if (!content) {
    throw new ApiError(400, "Tweet content cannot be empty");
  }

  const tweet = await Tweet.create({
    owner: userId,
    content,
  });

  if (!tweet) {
    throw new ApiError(
      500,
      "Cannot create tweet due to some problem , Please try again later",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});
//Testing
const getUserTweets = asyncHandler(async (req, res) => {
  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: req?.user?._id,
      },
    },
  ]);

  if (!userTweets) {
    throw new ApiResponse(300, {}, "No tweet found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "Fetched user tweets successfully"));
});
//Testing
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req?.params;
  const { content } = req?.body;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id not found");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true },
  );

  if (!updatedTweet) {
    throw new ApiError(500, "Error while updating tweets");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});
//Testing
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req?.params;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id not found");
  }
  const tweetToBeDeleted = await Tweet.findByIdAndDelete(tweetId);
  if (!tweetToBeDeleted) {
    throw new ApiError(400, "Cannot found tweet with this id");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet , deleteTweet };
