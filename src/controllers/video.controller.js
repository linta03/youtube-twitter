import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  let queryObject = {};

  if (query) {
    queryObject = {
      $text: { $search: query },
    };
  }

  if (userId) {
    queryObject.owner = userId;
  }

  // Pagination options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType === "asc" ? 1 : -1 },
  };
  const videos = await Video.aggregatePaginate(queryObject, options);

  if (!videos) {
    throw new ApiError(406, "No video found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const uploadVideo = asyncHandler(async (req, res) => {
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
  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "No Video found with this id");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
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
  return res.status(200).json(200, {}, "Video deleted successfully");
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req?.params;
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !isPublished,
      },
    },
    { new: true },
  );
  if (!updatedVideo) {
    throw new ApiError(400, "Cannot find video with this id ");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Publish status changed successfully"),
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
