import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  if (!isValidObjectId) {
    throw new ApiError(400, "Invalid user id");
  }

  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        subscriberCount: {
          $sum: 1,
        },
      },
    },
  ]);

  const video = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $project: {
        totalLikes: {
          $size: "$likes",
        },
        totalViews: "$views",
        totalVideos: 1,
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: "$totalLikes",
        },
        totalViews: {
          $sum: "$totalViews",
        },
        totalVideos: {
          $sum: 1,
        },
      },
    },
  ]);

  const channelStats = {
    totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
    totalLikes: video[0]?.totalLikes || 0,
    totalViews: video[0]?.totalViews || 0,
    totalVideos: video[0]?.totalVideos || 0,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, "Fetched Channel stats successfully"),
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { userId } = req?.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
      },
    },
    {
      $project: {
        videofile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        owner: 1,
        likesCount: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
