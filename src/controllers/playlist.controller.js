import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "All field are required!");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(400, "create playlist failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully.!"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(400, "user not found");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalViews: {
          $sum: "$videos.views",
        },
        totalVideos: {
          $size: "$videos",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        videos: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "User playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "playlist not found");
  }

  const playlistVideo = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
      $unwind: "$videos",
    },
    {
      $lookup: {
        from: "users",
        localField: "videos.owner",
        foreignField: "_id",
        as: "videoOwners",
      },
    },
    {
      $unwind: "$videoOwners",
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        description: { $first: "$description" },
        totalViews: { $sum: "$videos.views" },
        totalVideos: { $sum: 1 },
        videos: {
          $push: {
            _id: "$videos._id",
            videoFile: "$videos.videoFile",
            thumbnail: "$videos.thumbnail",
            title: "$videos.title",
            description: "$videos.description",
            duration: "$videos.duration",
            createdAt: "$videos.createdAt",
            views: "$videos.views",
            isPublished: "$videos.isPublished",
            owner: {
              _id: "$videoOwners._id",
              username: "$videoOwners.username",
              email: "$videoOwners.email",
            },
          },
        },
        owner: { $first: "$owner" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        totalViews: 1,
        totalVideos: 1,
        videos: 1,
        owner: {
          _id: 1,
          username: 1,
          fullName: 1,
          email: 1,
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistVideo, "playlist fetched successfully.!")
    );
});


const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  const existingIndex = playlist.videos.findIndex(
    (id) => id.toString() === videoId
  );

  if (existingIndex !== -1) {
    playlist.videos[existingIndex] = video._id;
  } else {
    playlist.videos.push(video._id);
  }

  const updatedPlaylist = await playlist.save();

  if (!updatedPlaylist) {
    throw new ApiError(400, "Failed to add video to playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await Playlist.findById(playlistId);

  const index = playlist.videos.indexOf(videoId);
  if (index !== -1) {
    playlist.videos.splice(index, 1);
  } else {
    throw new ApiError(400, "Video is not in the playlist");
  }

  await playlist.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlist: playlist },
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlistDelete = await Playlist.findByIdAndDelete(playlistId);

  if (!playlistDelete) {
    throw new ApiError(400, "failed to delete playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "playlist Deleted successfully.!"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlistUpdated = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!playlistUpdated) {
    throw new ApiError(400, "failed to update playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistUpdated, "playlist updated successfully.!")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
