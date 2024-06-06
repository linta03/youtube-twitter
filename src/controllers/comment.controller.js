import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const pipeline = [];

  if (!videoId) {
    throw new ApiError(400, "Video Id not found");
  }
  pipeline.push({
    $match: { video: videoId },
  });
  // queryObj.video = videoId
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };
  const myAggregate = Comment.aggregate(pipeline);
  const comments = await Comment.aggregatePaginate(myAggregate, options);

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
export { getVideoComments, createAComment };
