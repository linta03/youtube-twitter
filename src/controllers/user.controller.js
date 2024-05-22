import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  // const existedUser = User.findOne({
  //   $or: [{ userName }, { email }],
  // });
  // if (existedUser) {
  //   throw new ApiError(409, "User with this email or password already exists");
  // }
  const avatarLocalPath = req?.files?.avatar[0]?.path;
  const coverImgLocalPath = req.files?.coverImg[0]?.path;

  console.log(coverImgLocalPath);

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
      400,
      "Something went wrong while creating user, Please try again later",
    );
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

export { registerUser };
