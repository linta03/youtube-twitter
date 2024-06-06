import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubsciption = asyncHandler(async (req, res) => {
   // get user Id,
   // validate that
   // now find in subscription model if its subscribed or not
   // if subscribed delete that user from subscription model
   // other way add that

   

});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {});

const getUserSubscribedTo = asyncHandler(async (req, res) => {});

export { toggleSubsciption, getUserChannelSubscribers, getUserSubscribedTo };
