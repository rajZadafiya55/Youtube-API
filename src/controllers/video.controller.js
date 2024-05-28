import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteCloudniary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const video = await Video.aggregate([
    // {
    //   $match: {
    //     isPublished: true,
    //   },
    // },
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
        foreignField: "video",
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
        videoFile: 1,
        duration: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        views: 1,
        isPublished: 1,
        likeCount: 1,
        createdAt: 1,
        owner: {
          username: 1,
          avatar: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "All Videos Fetched Successfully..!"));
});

// const publishAVideo = asyncHandler(async (req, res) => {
//   const { title, description } = req.body;
//   if (!title || !description) {
//     throw new ApiError(400, "All Field is required");
//   }
//   //   console.log("req.files video",req.files?.videoFile[0].path)
//   //   console.log("req.files thumbnail ", req.files?.thumbnail[0].path);

//   const videoLocalPath = req.files?.videoFile[0].path;
//   const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

//   if (!videoLocalPath) {
//     throw new ApiError(400, "videoFilePath is required");
//   }

//   if (!thumbnailLocalPath) {
//     throw new ApiError(400, "thumbnailFilePath is required");
//   }
//   //   const vide0Path = req.files?.video
//   //   console.log(title, description);

//   const video = await uploadOnCloudinary(videoLocalPath);
//   const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

//   if (!video) {
//     throw new ApiError(400, "video file not found");
//   }
//   if (!thumbnailFile) {
//     throw new ApiError(400, "thumbnail file not found");
//   }

//   // console.log("video", video);
//   // console.log("thumbnail", thumbnailFile);

//   const videoUpload = await Video.create({
//     title,
//     description,
//     duration: video.duration,
//     videoFile: {
//       url: video.url,
//       public_id: video.public_id,
//     },
//     thumbnail: {
//       url: thumbnailFile.url,
//       public_id: thumbnailFile.public_id,
//     },
//     owner: req.user?._id,
//     isPublished: false,
//   });

//   return res
//     .status(200)
//     .json(new ApiResponse(200, videoUpload, "video uploaded Successfully"));
// });

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFile = req.files?.videoFile;
  const thumbnailFile = req.files?.thumbnail;

  console.log("res.files", req.files?.videoFile);

  if (!videoFile) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailFile) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const videoLocalPath = videoFile[0].path;
  const thumbnailLocalPath = thumbnailFile[0].path;

  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!video) {
    throw new ApiError(400, "Failed to upload video file");
  }

  if (!thumbnail) {
    throw new ApiError(400, "Failed to upload thumbnail file");
  }

  const videoUpload = await Video.create({
    title,
    description,
    duration: video.duration,
    videoFile: {
      url: video.url,
      public_id: video.public_id,
    },
    thumbnail: {
      url: thumbnail.url,
      public_id: thumbnail.public_id,
    },
    owner: req.user?._id,
    isPublished: false,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, videoUpload, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
              _id: 1,
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
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
      $addFields: {
        owner: {
          $first: "$owner",
        },
        subscribersCount: {
          $size: "$subscribers",
        },
        likes: {
          $size: "$likes",
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        title: 1,
        description: 1,
        views: 1,
        isPublished: 1,
        likes: 1,
        subscribersCount: 1,
        createdAt: 1,
        owner: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "video fetched Successfully.!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description, isPublished } = req.body;
  const thumbnailLocalPath = req.file?.path;

  // console.log("req.file",req.file?.path)

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  // console.log("delete", video.thumbnail.public_id);
  const deleteThumbnai = await video.thumbnail.public_id;
  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnailFile) {
    throw new ApiError(400, "thumbnail file not found");
  }

  console.log("thumbnail", thumbnailFile);

  const videoUpdate = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: {
          url: thumbnailFile.url,
          public_id: thumbnailFile.public_id,
        },
        isPublished,
      },
    },
    { new: true }
  );

  if (!videoUpdate) {
    throw new ApiError(400, "Failed to upload video");
  } else {
    await deleteCloudniary(deleteThumbnai, "image");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoUpdate, "video updated successfully.!"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  await deleteCloudniary(video.videoFile.public_id, "video");
  await deleteCloudniary(video.thumbnail.public_id, "image");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted Successfully.!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  // console.log("video", !video.isPublished);
  const publishToggle = await Video.findByIdAndUpdate(videoId, {
    $set: {
      isPublished: !video?.isPublished,
    },
  });

  if (!publishToggle) {
    throw new ApiError(400, "video toggle publish failed");
  }

  // console.log("publishToogle", publishToggle);
  // console.log("ispublish", isPublished);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: publishToggle.isPublished },
        "video publish toggled successfully.!"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
