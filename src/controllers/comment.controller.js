import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video Id not found");
  }
  const commentAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
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
        foreignField: "comment",
        localField: "_id",
        as: "commentLikes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$commentLikes",
        },
        ownerDetails: {
          $first: "$owner",
        },

        isLiked: {
          $cond: {
            if: { $in: [req?.user?._id, "$commentLikes.likedBy"] },
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
        createdAt: 1,
        likesCount: 1,
        ownerDetails: 1,
        isLiked: 1,
      },
    },
  ]);
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };
  const comments = await Comment.aggregatePaginate(commentAggregate, options);

  if (!comments) {
    throw new ApiError(400, "No comment found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const createAComment = asyncHandler(async (req, res) => {
  const userId = req?.user?._id;
  const { videoId } = req?.params;
  const { content } = req?.body;

  if (!videoId) {
    throw new ApiError(400, "Video Id is required");
  }
  if (content?.trim() === "") {
    throw new ApiError(400, "Comment should not be empty");
  }
  const comment = await Comment.create({
    content,
    owner: userId,
    video: videoId,
  });

  if (!comment) {
    throw new ApiError(
      400,
      "Cannot create comment due to some problem, Please try again later",
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req?.params;
  const { content } = req?.body;
  const userId = req?.user?._id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  if (!content) {
    throw new ApiError(400, "comment should not be empty");
  }
  const comment = await Comment.findById(commentId);

  if (comment?.owner.toString() !== userId?.toString()) {
    throw new ApiError(
      400,
      "you cannot edit this comment as you are not owner of this comment",
    );
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true },
  );

  if (!updatedComment) {
    throw new ApiError(500, "Failed to edit comment, Please try again later");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteAComment = asyncHandler(async (req, res) => {
  const { commentId } = req?.params;
  const userId = req?.user?._id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "No comment found");
  }

  if (comment?.owner?.toString() !== userId?.toString()) {
    throw new ApiError(
      400,
      "Only user who created this comment can delete this",
    );
  }

  await Comment.findByIdAndDelete(commentId);

  await Like.deleteMany({
    comment: commentId,
    likedBy: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, createAComment, updateComment, deleteAComment };
