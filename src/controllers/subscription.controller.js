import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const filter = {
    channel: channelId,
    subscriber: req.user._id,
  };

  const subscribed = await Subscription.findOne(filter);

  if (subscribed) {
    await Subscription.deleteOne(filter);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: false },
          "unsubscribed successfully"
        )
      );
  } else {
    await Subscription.create({ ...filter, isSubscribed: true });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isSubscribed: true }, "subscribed successfully")
      );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: channelId,
        subscriberCount: { $sum: 1 }, // Count the number of subscribers
        subscribers: { $push: "$subscriber" }, // Collect subscriber details
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscribers",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    // {
    //   $unwind: "$subscriber",
    // },
    {
      $project: {
        subscriberDetails: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
        },
        subscriberCount: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "channel subscribers fetched successfully.!"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriberId");
  }

  const subscribed = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $group: {
        _id: subscriberId,
        channelSubscribedCount: { $sum: 1 }, // Count the number of channels
        channels: { $push: "$channel" }, // Collect channel details
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channels",
        foreignField: "_id",
        as: "channelDetails",
      },
    },
    {
      $unwind: "$channelDetails",
    },
    {
      $addFields: {
        "channelDetails.isSubscribed": true,
      },
    },
    {
      $group: {
        _id: "$_id",
        channelSubscribedCount: { $first: "$channelSubscribedCount" },
        channelDetails: { $push: "$channelDetails" },
      },
    },
    {
      $project: {
        channelDetails: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          isSubscribed: 1,
        },
        channelSubscribedCount: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, subscribed, "Channels fetched successfully.!"));
});

export default getSubscribedChannels;

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
