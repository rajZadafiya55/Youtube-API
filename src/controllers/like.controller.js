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

  const filter = {
    video: videoId,
    likedBy: req.user?._id,
  };
  const liked = await Like.findOne(filter);

  if (liked) {
    await Like.findByIdAndDelete(liked._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create(filter);

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const filter = {
    comment: commentId,
    likedBy: req.user?._id,
  };
  const liked = await Like.findOne(filter);

  if (liked) {
    await Like.findByIdAndDelete(liked._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create(filter);

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const filter = {
    tweet: tweetId,
    likedBy: req.user?._id,
  };
  const liked = await Like.findOne(filter);

  if (liked) {
    await Like.findByIdAndDelete(liked._id);
    return res.status(200).json(new ApiResponse(200, { isLiked: false }));
  }

  await Like.create(filter);

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const videos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
        video: {
          $exists: true,
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          {
            $unwind: "$owner",
          },
        ],
      },
    },
    {
      $unwind: "$videos",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        videos: {
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          videoFile: 1,
          thumbnail: 1,
          createdAt: 1,
          isPublished: 1,
          owner: {
            username: 1,
            avatar: 1,
          },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "liked videos fetched successfully..!"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
