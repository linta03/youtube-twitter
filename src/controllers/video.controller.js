import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadVideo = asyncHandler(async (req, res) => {
  //   check if user is logged in
  const user = req?.user?._id;
  if (!user) {
    throw new ApiError(404, "User is not logged in");
  }

  //   validate input data
  const thumbnailLocalPath = req?.files?.thumbnail[0]?.path;
  const youtubeVideoLocalPath = req?.files?.youtube_video[0]?.path;
  const { title, description, isPublished } = req.body;

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

export { uploadVideo };
