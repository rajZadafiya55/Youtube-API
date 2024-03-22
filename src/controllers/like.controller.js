import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const liked = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (liked) {
    await Like.findByIdAndDelete(liked._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const liked = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (liked) {
    await Like.findByIdAndDelete(liked._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const liked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (liked) {
    await Like.findByIdAndDelete(liked._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const like = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $unwind: "$videos",
    },
    {
      $project: {
        videos: {
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          owner: 1,
          videFile: 1,
          thumbnail: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, like, "LikedVideo fetched successfully..!"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
