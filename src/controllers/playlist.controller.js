import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
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
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  // const { playlistId } = req.params;
  // if (!isValidObjectId(playlistId)) {
  //   throw new ApiError(400, "Invalid PlaylistId");
  // }
  // const playlist = await Playlist.findById(playlistId);
  // if (!playlist) {
  //   throw new ApiError(400, "playlist not found");
  // }
  // return res.status(200).json(200, playlist, "playlist fetched successfully.!");
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;
  console.log(videoId, playlistId);

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(400, "playlist not found");
  }

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const addVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      videos: [video._id],
    },
    { new: true }
  );

  console.log(addVideo);

  if (!addVideo) {
    throw new ApiError(400, "failed to add video into playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, addVideo, "video added into playlist successfully.!")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "playlist not found");
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

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "playlist not found");
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
