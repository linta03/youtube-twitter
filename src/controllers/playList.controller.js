import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PlayList } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req?.body;
  if (name.trim() === "" && description.trim() === "") {
    throw new ApiError(400, "Name and description are required");
  }

  const playlist = await PlayList.create({
    name,
    description,
    owner: req?.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Failed to create playlist  ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const updatePlayList = asyncHandler(async (req, res) => {
  const { playlistId } = req?.params;
  const { name, description } = req?.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if (name.trim() === "" && description.trim() === "") {
    throw new ApiError(400, "Name and description are required");
  }

  const playList = await PlayList.findById(playlistId);

  if (!playList) {
    throw new ApiError(404, "No playList found");
  }

  if (playList?.owner.toString() !== req?.user?._id.toString()) {
    throw new ApiError(400, "Only owner of this playlist can update this");
  }

  const updatedPlayList = await PlayList.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true },
  );

  if (!updatedPlayList) {
    throw new ApiError(500, "Failed to update playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlayList, "Playlist updated successfully"),
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req?.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }
  const playlist = await PlayList.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Cannot find playlist");
  }
  if (playlist?.owner?.toString() !== req?.user?._id?.toString()) {
    throw new ApiError(400, "Only owner of this playlist can delete this");
  }

  await PlayList.findByIdAndDelete(playlist?._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req?.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const video = await Video.findById(videoId);
  const playList = await PlayList.findById(playlistId);
  if (!video) {
    throw new ApiError(404, "Cannot find video with this id");
  }
  if (!playList) {
    throw new ApiError(404, "Cannot find playlist with this id");
  }

  if (
    video?.owner.toString() !== req?.user?._id.toString() &&
    playList?.owner.toString() !== req?.user?._id.toString()
  ) {
    throw new ApiError(400, "Only owner can add video to the playlist");
  }
  const updatedPlayList = await PlayList.findByIdAndUpdate(
    playList?._id,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true },
  );
  if (!updatedPlayList) {
    throw new ApiError(500, "Failed to update playlist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlayList,
        "Video added to playlist successfully",
      ),
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req?.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist Id");
  }
  const video = await Video.findById(videoId);
  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (
    playlist?.owner.toString() !== req?.user?.id.toString() &&
    video?.owner?.toString() !== req?.user?._id.toString()
  ) {
    throw new ApiError(400, "Only owner can delete video from playlist");
  }

  const updatedPlaylist = await PlayList.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true },
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "Failed to delete video from playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Deleted video from playlist successfully",
      ),
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId) {
    throw new ApiError(400, "Invalid playlist id");
  }
  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "No Playlist found");
  }

  const playlistDetails = await PlayList.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $match: {
        "videos.isPublished": true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$userDetails",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          thumbnail: 1,
          videoFile: 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
          isPublished: 1,
        },
        owner: {
          username: 1,
          fullName: 1,
          avatar: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlistDetails,
        "Playlist details fetched successfully",
      ),
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const playlists = await PlayList.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        updatedAt: 1,
        videos: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "Playlists of user fetched successfully"),
    );
});

export {
  createPlaylist,
  updatePlayList,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPlaylistById,
  getUserPlaylists,
};
