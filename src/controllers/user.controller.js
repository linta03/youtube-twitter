import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong, while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user data from response
  //validate user data
  //check if user already exists or not
  //check img and avatars
  //upload them to cloudinary
  //create user object
  //remove password and refresh token field from response
  //check for user creation
  //return response

  const { fullName, userName, email, password } = req.body;
  if (
    [fullName, userName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with this email or password already exists");
  }
  const avatarLocalPath = req?.files?.avatar[0]?.path;
  const coverImgLocalPath = req.files?.coverImg[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImg = await uploadOnCloudinary(coverImgLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    password,
    email,
    avatar: avatar.url,
    coverImg: coverImg?.url || "",
  });
  const createdUser = await User.findById(user?._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while creating user, Please try again later",
    );
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from user
  // check if data is empty or not
  // check in database if user with email exists or not
  // if not exists throw err
  // if exists check password
  // check if user password is same or not
  // if not throw err
  //access and refesh token generation
  //create options for cookies
  //send those token as cookies
  // if matched just log in

  const { password, userName, email } = req.body;

  if ([password, userName, email].some((val) => val.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(401, "User with this email or username not existed");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Password does not match");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findOne(user?._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged in successfully",
      ),
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );

  return res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req?.cookies?.refreshToken || req?.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthooorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id,
    );

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token refreshed successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // get old password and new password
  // get user from req?.userca
  // find user from db
  //match old password with password that is stored in db
  // if that is true update password
  // otherwise throw an error
  // update password in database

  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req?.user?._id);
  const isPasswordMatched = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordMatched) {
    throw new ApiError(400, "Invalid Old Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password has been updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const { _id } = req?.user;
  return res
    .status(400)
    .json(new ApiResponse(200, _id, "Current User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req?.body;
  if (!fullName || !email) {
    throw new ApiError(400, "Fullname and email is required");
  }
  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true },
  ).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(
      500,
      "Something went wrong while updating user, Please try again later",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User has been updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarPath = req?.files?.avatar[0]?.path;
  const { user } = req;
  if (!avatarPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarPath);
  console.log(avatar?.url);
  if (!avatar.url) {
    throw new ApiError(500, "Error while upload avatar");
  }
  const userWithUpdatedAvatar = await User.findByIdAndUpdate(
    user?._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    { new: true },
  ).select("-password -refreshToken");

  if (!userWithUpdatedAvatar) {
    throw new ApiError(500, "Error while updating avatar");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userWithUpdatedAvatar,
        "User avatar updated successfully",
      ),
    );
});

const updateUserCoverImg = asyncHandler(async (req, res) => {
  const { user } = req;
  console.log(req?.files);
  const coverImgpath = req?.files?.coverImg[0]?.path;

  if (!coverImgpath) {
    throw new ApiError(400, "Cover Image is missing");
  }
  const coverImg = await uploadOnCloudinary(coverImgpath);
  if (!coverImg.url) {
    throw new ApiError(500, "Error while uploading cover image");
  }
  const userWithUpdatedCoverImg = await User.findByIdAndUpdate(
    user?._id,
    {
      $set: {
        coverImg: coverImg.url,
      },
    },
    {
      new: true,
    },
  ).select("-password -refreshToken");

  if (!userWithUpdatedCoverImg) {
    throw new ApiError(500, "Error while saving cover Img");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userWithUpdatedCoverImg,
        "Cover Image updated successfully",
      ),
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { userName } = req?.params;
  if (!userName?.trim()) {
    throw new ApiError(400, "Username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req?.user?._id, "$subscribers.subscriber"] },
            then: false,
            else: true,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImg: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "ProfileData fetched successfully "),
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user) {
    throw new ApiError(404, "Something went wrong while getting watch history");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successFully ",
      ),
    );
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImg,
  getUserProfile,
  getWatchHistory,
};
