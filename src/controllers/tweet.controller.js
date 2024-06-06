import mongoose, { isValidObjectId } from "mongoose";
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

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req?.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user Id");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              avatar: 1,
              userName: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetails",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likeDetails",
        },
        ownerDetails: {
          $first: "$ownerDetails",
        },
        isLiked: {
          $cond: {
            if: { $in: [req?.user?._id, "$likeDetails.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        isLiked: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!tweets || tweets.length === 0) {
    throw new ApiError(300, "This user has no tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Fetched user tweets successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req?.params;
  const { content } = req?.body;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id not found");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "No tweet found with this id");
  }
  console.log(new mongoose.Types.ObjectId(tweet?.owner));
  console.log(req?.user?._id);
  if (req?.user?._id?.toString() !== tweet?.owner?.toString()) {
    throw new ApiError(
      400,
      "Only user who created this tweet can update this tweet",
    );
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

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req?.params;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id not found");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "Cannot find tweet with this Id");
  }

  if (tweet?.owner?.toString() !== req?.user?._id?.toString()) {
    throw new ApiError(
      400,
      "Only user who created this tweet can delete this tweet",
    );
  }
  const tweetToBeDeleted = await Tweet.findByIdAndDelete(tweetId);
  if (!tweetToBeDeleted) {
    throw new ApiError(400, "Cannot found tweet with this id");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
