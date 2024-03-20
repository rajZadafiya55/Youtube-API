import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiRespone.js";

const getAllTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const tweet = await Tweet.find({});

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "All Tweet fetched Successfully.!"));
});

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "content is required");
  }

  const { _id } = req.user;

  if (!mongoose.isValidObjectId(_id)) {
    throw new ApiError(400, "Invalid owner ID");
  }

  const owner = await User.findById(_id);

  if (!owner) {
    throw new ApiError(404, "Owner not found");
  }

  const tweet = await Tweet.create({
    content,
    owner: owner?._id,
  });

  if (!tweet) {
    throw new ApiError(500, "failed to create tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  if (!isValidObjectId(userId)) { 
    throw new ApiError(400, "Invalid userId");
  }

  const tweet = await Tweet.aggregate([
    { 
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $addFields: {
        likeCount: {
          $size: "$likes",
        },
      },
    },
    {
      $project: {
        content: 1,
        video: 1,
        owner: {
          _id: 1,
          username: 1,
          fullName: 1,
        },
        likeCount: 1,
      },
    },
  ]);

  if (tweet.length === 0) {
    return res.status(404).json(new ApiResponse(404, null, "No tweets found for this user."));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet fetched Successfully.!"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content) {
    throw new ApiError(400);
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Inavalid tweetId");
  }
  
  const newTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, newTweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet

  const { tweetId } = req.params;

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const deleteTweet = await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, deleteTweet, "tweet delete Successfully"));
});

export {getAllTweets, createTweet, getUserTweets, updateTweet, deleteTweet };
