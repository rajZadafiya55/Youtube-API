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
    {
      $match: {
        isPublished: true,
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
          _id: 1,
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

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFile = req.files?.videoFile;
  const thumbnailFile = req.files?.thumbnail;


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

  try {
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
          let: { videoId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$video", "$$videoId"],
                },
              },
            },
          ],
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "owner._id",
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
          likesCount: {
            $size: "$likes",
          },
          isSubscribed: {
            $in: [
              new mongoose.Types.ObjectId(req.user?._id),
              "$subscribers.subscriber",
            ],
          },
          likeFlag: {
            $in: [new mongoose.Types.ObjectId(req.user?._id), "$likes.likedBy"],
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
          likesCount: 1,
          subscribersCount: 1,
          createdAt: 1,
          owner: 1,
          isSubscribed: 1,
          likeFlag: 1,
        },
      },
    ]);

    if (!video || video.length === 0) {
      throw new ApiError(404, "Video not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, video[0], "Video fetched successfully"));
  } catch (error) {
    console.error(error); // Log any errors for debugging
    throw new ApiError(500, "Internal Server Error");
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, isPublished, thumbnail } = req.body;
  const thumbnailLocalPath = req.file?.path;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid VideoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  let thumbnailFile = null;
  let isCloudinaryImage = false;

  // Check if thumbnail is already a Cloudinary image
  if (thumbnail && typeof thumbnail === "string") {
    const cloudinaryUrlPattern = /^https?:\/\/res\.cloudinary\.com\/.*$/;
    isCloudinaryImage = cloudinaryUrlPattern.test(thumbnail);

    if (isCloudinaryImage) {
      thumbnailFile = {
        url: thumbnail,
        public_id: video.thumbnail.public_id,
      };
    }
  }

  // If not a Cloudinary image, upload new thumbnail
  if (!isCloudinaryImage && thumbnailLocalPath) {
    thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);
  }

  // Prepare update data
  const updateData = {
    title,
    description,
    isPublished,
  };

  if (thumbnailFile) {
    updateData.thumbnail = {
      url: thumbnailFile.url,
      public_id: thumbnailFile.public_id,
    };
  }

  // Update video details
  const videoUpdate = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: updateData,
    },
    { new: true }
  );

  if (!videoUpdate) {
    throw new ApiError(400, "Failed to update video");
  } else if (!isCloudinaryImage && video.thumbnail.public_id) {
    await deleteCloudniary(video.thumbnail.public_id, "image");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoUpdate, "Video updated successfully."));
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

  const publishToggle = await Video.findByIdAndUpdate(videoId, {
    $set: {
      isPublished: !video?.isPublished,
    },
  });

  if (!publishToggle) {
    throw new ApiError(400, "video toggle publish failed");
  }

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

const toggleWatchLater = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId!");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Cannot find video");
  }

  // Toggle the watch later status
  const videoStatus = !video.isWatchLater;
  video.isWatchLater = videoStatus;
  await video.save(); // Save the updated status to the video document

  const userId = req.user._id; // Assume user ID is available in the request object

  if (videoStatus) {
    // Add the videoId to watchHistory
    await User.updateOne(
      { _id: userId },
      { $addToSet: { watchHistory: videoId } }
    );
  } else {
    // Remove the videoId from watchHistory
    await User.updateOne({ _id: userId }, { $pull: { watchHistory: videoId } });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { videoStatus }, "Video status updated successfully")
    );
});

//{{server}}videos/views/66114baf276da225cfe981b0
const videoViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId!");
  }

  let video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Cannot find video");
  }

  video.views += 1;

  await video.save();

  const videoStatus = video.views;

  return res
    .status(200)
    .json(
      new ApiResponse(200, { videoStatus }, "Video status updated successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  toggleWatchLater,
  videoViews,
};
