import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req?.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }
  const likedAlready = await Like.findOne({
    video: videoId,
    likedBy: req?.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isliked: false }, "Unliked video successfully"),
      );
  }
  const liked = await Like.create({
    video: videoId,
    likedBy: req?.user?._id,
  });

  if (!liked) {
    throw new ApiError(500, "Failed to like video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { isliked: true }, "Liked video Successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req?.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment Id");
  }
  const likedAlready = await Like.findOne({
    comment: commentId,
    likedBy: req?.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isliked: false },
          "Unliked comment successfully",
        ),
      );
  }
  const liked = await Like.create({
    comment: commentId,
    likedBy: req?.user?._id,
  });

  if (!liked) {
    throw new ApiError(500, "Failed to like comment");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isliked: true }, "Liked comment Successfully"),
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req?.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }
  const likedAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req?.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready?._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isliked: false }, "Unliked tweet successfully"),
      );
  }
  const liked = await Like.create({
    tweet: tweetId,
    likedBy: req?.user?._id,
  });

  if (!liked) {
    throw new ApiError(500, "Failed to like tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { isliked: true }, "Liked tweet Successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req?.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          {
            $unwind: "$owner",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideos",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        likedVideos: {
          videofile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          owner: {
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Fetched liked videos successfully"),
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
