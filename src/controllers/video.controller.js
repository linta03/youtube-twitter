import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  const pipeline = [];

  // adding search query pipeline
  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"],
        },
      },
    });
  }

  // only get current user videos
  if (!userId) {
    throw new ApiError(400, "User Id is required");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user Id");
  }
  pipeline.push({
    $match: {
      owner: new mongoose.Types.ObjectId(userId),
    },
  });

  // only videos that are published
  pipeline.push({ $match: { isPublished: true } });

  // sorting
  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  //get user details
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    },
  );

  const videoAggregate = Video.aggregate(pipeline);
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  const videos = await Video.aggregatePaginate(videoAggregate, options);

  if (!videos || videos.docs.length === 0) {
    throw new ApiError(406, "No video found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const uploadVideo = asyncHandler(async (req, res) => {
  console.log(req?.files);
  const thumbnailLocalPath = req?.files?.thumbnail[0]?.path;
  const youtubeVideoLocalPath = req?.files?.youtube_video[0]?.path;
  const { title, description, isPublished } = req.body;
  const userId = req?.user?._id;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail not found");
  }
  if (!youtubeVideoLocalPath) {
    throw new ApiError(400, "Video not found");
  }

  if (!(title.trim() && description.trim())) {
    throw new ApiError(400, "Title and description not found");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const youtubeVideo = await uploadOnCloudinary(youtubeVideoLocalPath, {
    resource_type: "video",
  });

  if (!thumbnail || !youtubeVideo) {
    throw new ApiError(400, "Error uploading files");
  }

  const duration = youtubeVideo?.duration;

  const video = await Video.create({
    videofile: youtubeVideo?.url,
    thumbnail: thumbnail?.url,
    title,
    description,
    isPublished,
    duration,
    owner: userId,
  });

  if (!video) {
    throw new ApiError(
      500,
      "Something went wrong while uploading video please try again later",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req?.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is required");
  }
  if (!isValidObjectId(req?.user?._id)) {
    throw new ApiError(400, "User id is required");
  }
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req?.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              "avatar.url": 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: { $in: [req?.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videofile: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
        user: 1,
      },
    },
  ]);
  if (!video) {
    throw new ApiError(400, "Failed to fetch video");
  }

  await Video.findByIdAndUpdate(videoId, {
    $inc: {
      views: 1,
    },
  });

  await User.findByIdAndUpdate(req?.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  console.log(req);

  const { videoId } = req?.params;
  const { title, description, isPublished } = req?.body;

  if (!(title || description)) {
    throw new ApiError(400, "Title , desscription is required");
  }

  if (title?.trim() === "" || description?.trim() === "") {
    throw new ApiError(400, "All fields are required (title & description)");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        isPublished,
      },
    },
    {
      new: true,
    },
  ).select("-owner");
  if (!video) {
    throw new ApiError(
      500,
      "Something went wrong while updating video details",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
  const { videoId } = req?.params;
  const thumbnailLocalPath = req?.files?.thumbnail[0]?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail?.url) {
    throw new ApiError(400, "Thumbnail not found");
  }

  const videoWithUpdatedDetails = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: thumbnail?.url,
      },
    },
    {
      new: true,
    },
  ).select("-owner");

  if (!videoWithUpdatedDetails) {
    throw new ApiError(500, "Error while saving thumbnail");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoWithUpdatedDetails,
        "Thumbnail updated successFully",
      ),
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req?.params;

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  if (!deletedVideo) {
    throw new ApiError(404, `No video found with this (${videoId}) id `);
  }

  await Like.deleteMany({
    video: videoId,
  });
  await Comment.deleteMany({
    video: videoId,
  });
  return res.status(200).json(200, {}, "Video deleted successfully");
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req?.params;
  const { isPublished } = req?.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "No video found");
  }

  if (video?.owner?.toString() !== req?.user?._id?.toString()) {
    throw new ApiError(400, "Only user who upload this video can update this ");
  }

  const togglePublishedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video?.isPublished,
      },
    },
    { new: true },
  );
  if (!togglePublishedVideo) {
    throw new ApiError(500, "Failed to toggle publish video ");
  }
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isPublished: togglePublishedVideo?.isPublished,
      },
      "Publish status changed successfully",
    ),
  );
});

export {
  getAllVideos,
  uploadVideo,
  getVideoById,
  updateVideoDetails,
  updateVideoThumbnail,
  deleteVideo,
  togglePublishStatus,
};
