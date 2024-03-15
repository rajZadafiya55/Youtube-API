import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "All Field is required");
  }
  //   console.log("req.files video",req.files?.videoFile[0].path)
  //   console.log("req.files thumbnail ", req.files?.thumbnail[0].path);

  const videoLocalPath = req.files?.videoFile[0].path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "videoFilePath is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnailFilePath is required");
  }
  //   const vide0Path = req.files?.video
  //   console.log(title, description);

  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video) {
    throw new ApiError(400, "video file not found");
  }
  if (!thumbnailFile) {
    throw new ApiError(400, "thumbnail file not found");
  }

  console.log("video", video);
  console.log("thumbnail", thumbnailFile);

  const videoUpload = await Video.create({
    title,
    description,
    duration: video.duration,
    videoFile: video.url,
    thumbnail: thumbnailFile.url,
    owner: req.user?._id,
    isPublished: false,
  });
  
  return res
    .status(200)
    .json(new ApiResponse(200, videoUpload, "video uploaded Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
