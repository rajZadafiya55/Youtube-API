import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiRespone.js";

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
  const { _id } = req.params;
  const tweet = await Tweet.findById( _id );

  console.log("tweet", tweet);

  if (!tweet) {
    throw new ApiError(400, "data not Found");
  }
  return res.status(200).json(200, tweet, "Tweet fetched Successfully.!");
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

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "tweet not found");
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

export { createTweet, getUserTweets, updateTweet, deleteTweet };
