import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

const getAllVideos = asyncHandler(async (req, res) => {
  // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
  //TODO: get all videos based on query, sort, pagination
  // get all videos based on query, sort, pagination
  // run a query
  // we also check for query i.e through which we can search from search bar
  // first check for page and limit
  // sortBy - createdAt, views, duration
  // sortType - ascending, descending
  // sort by UserId i.e get all the videos for user
  try {
    const { page, limit, query, sortBy, userId, username } = req.query;

    const pageOptions = {
      page: Number(page) || 0,
      limit: Number(limit) || 10,
    };

    let pipelineArr = [
      {
        $match: {
          isPublic: tru,
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreginField: "video",
          as: "likes",
        },
      },
      {
        $addFields: {
          likes: { $size: { $ifNull: ["$likes", []] } },
        },
      },
    ];

    pipelineArr.push({
      $lookup: {
        from: "users",
        localField: "owner",
        foreginField: "_id",
        as: "channel",
      },
    });

    pipelineArr.push({
      $unwind: "$channel",
    });
    // TODO: think of matching channel also
    pipelineArr.push({
      $project: {
        _id: 1,
        owner: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        duration: 1,
        views: 1,
        channelId: "$channel._id",
        channel: "$channel.username",
        channelFullName: "$channel.fullName",
        channelAvatar: "$channel.avatar",
        createAt: 1,
        likes: 1,
        description: 1,
      },
    });
    if (username) {
      pipelineArr.push({
        $match: {
          channel: username,
        },
      });
    }

    if (query) {
      pipelineArr.push({
        $match: {
          title: {
            $regex: query,
            $options: "i",
          },
        },
      });
    }

    if (username) {
      pipelineArr.push({
        $match: {
          channel: username,
        },
      });
    }

    if (query) {
      pipelineArr.push({
        $match: {
          title: {
            $regex: query,
            $options: "i",
          },
        },
      });
    }

    if (sortBy) {
      if (sortType === "ascending") {
        // oldest in case of createAt
        pipelineArr.push({
          $sort: {
            [sortBy]: 1,
          },
        });
      }
    }

    if (sortType == "descending") {
      // newest in case of createdAt
      pipelineArr.push({
        $sort: {
          [sortBy]: -1,
        },
      });
    }

    if (userId) {
      pipelineArr.push({
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      });
    }

    const result = await Video.aggregate(pipelineArr)
      .skip(pageOptions.limit * pageOptions.page)
      .limit(pageOptions.limit);

    res
      .status(200)
      .json(new ApiResponse(200, result, "videos fetched successfully"));
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      status: error?.statusCode || 500,
      message: error?.message || "some error in querying videos",
    });
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  // get video, upload to cloudinary, createvideo
  // req.user- user, check if there or not
  // title, decription, check if there not
  // upload file on multer, check if there or not
  // local path from multer and upload it on cloudinary
  // find video length etc from cloudinary
  // if there is anything in is public then also update that
  // TODO: get video, upload to cloudinary, create video
  try {
    const { title, description, thumbnail } = req.body;

    console.log(req.body);
    console.log("VIDEO UPLOAD", req.user)
    console.log("VIDEO UPLOAD", req.user.id)


    console.log("video:", title, description);

    if (!req.files.videoFile || !req.files.thumbnail) {
      if (req.files.videoFile) {
        fs.unlinkSync(req.files?.videoFile[0]?.path);
      }
      if (req.files.thumbnail) {
        fs.unlinkSync(req.files?.thumbnail[0]?.path);
      }
      throw new ApiError(401, "Either videofile or thumbnail is missing");
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    // console.log("videoPath",videoFileLocalPath)
    // console.log("thumbPath", thumbnailLocalPath);

    const videoUpload = await uploadOnCloudinary(videoFileLocalPath);

    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    //  console.log("thubnail", thumbnailUpload, "AND", videoUpload)

    if (!(videoUpload || thumbnailUpload))
      throw new ApiError(
        500,
        "Uploading error while uploading video or thumbnail"
      );

    const video = await Video.create({
      videoFile: videoUpload.url,
      videoFilePublicId: videoUpload.public_id,
      thumbnail: thumbnailUpload.url,
      thumbnailPublicId: thumbnailUpload.public_id,
      title,
      description,
      duration: videoUpload.duration,
      isPublic: req.body.isPublic == "false" ? false : true,
      owner: req.user?._id

    });
    // console.log("FINAL VIDSCHEMA", video);
    // console.log("THUMBNAIL", thumbnailUpload, "AND", videoUpload)

    // await sendEmail(res, "pubilishedVideo", ownerEmail, video._id, video.title)

    return res
      .status(201)
      .json(new ApiResponse(201, video, "video is published"));
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      status: error?.statusCode || 500,
      message: error?.message || "some error in publishng video",
    });
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  try {
    //TODO: get video by id
    // this is for getting video info and displaying it in card if its not there
    const { videoId } = req.params;
    console.log("VIDEOID:", videoId)
    // console.log("PRAMS", req.body)
    // get video by id
    if (!videoId) throw new ApiError(400, "videoId is missing");

    const video = await Video.findOne({
      _id: new mongoose.Types.ObjectId(videoId),
    });

    console.log("VIDEO FROM VIDEOID",video)

    // can update this so that owner can only see through id
    if (!video )//|| !video?.isPublic)
      throw new ApiError(400, `video with this ${videoId} is not available`);

    res.status(200).json(new ApiResponse(200, video, "got video from id"));
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      status: error?.statusCode || 500,
      message: error?.message || "some error in getting video by id",
    });
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    
    //TODO: update video details like title, description, thumbnail
    if (!videoId) throw new ApiError(400, "videoId missing");

    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;
    if (!title && !description && !thumbnailLocalPath)
      throw new ApiError(
        400,
        "either send updated title, description or thumbnail"
      );

    const userId = req.user._id;
    if (!userId) throw new ApiError(400, "user not logged in");
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(400, "video with this videoId is missing");

    const ownerId = video?.owner;
    const permission = JSON.stringify(ownerId) == JSON.stringify(userId);
    // console.log(JSON.stringify(ownerId), JSON.stringify(userId))

    if (!permission) throw new ApiError(400, "Login with owner id");

    if (thumbnailLocalPath) {
      var thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
      if (video.thumbnailPublicId) {
        deleteFromCloudinary(video.thumbnailPublicId).catch((err) =>
          console.log(err)
        );
      }
    }

    const updatedObj = {};
    if (title) updatedObj.title = title;
    if (description) updatedObj.description = description;
    if (thumbnailLocalPath) updatedObj.thumbnail = thumbnail.url;
    updatedObj.thumbnailPublicId = thumbnail.public_id;

    const updatedVideo = await Video.findByIdAndUpdate(
      new mongoose.Types.ObjectId(videoId),
      updatedObj,
      {
        new: true,
      }
    );

    res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "video updated successfully"));
  } catch (error) {
    res.status(error?.errorCode || 500).json({
      status: error?.statusCode || 500,
      message: error?.message || "some error in updating the video",
    });
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    //TODO: delete video
    console.log("DELETE",videoId);
    console.log("DELETE", req.user)
    if (!videoId) throw new ApiError(400, "videoId is missing");
    if (!req.user) throw new ApiError(400, "user not logged in");

    const userId = req.user._id;
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(400, "video with this videoId is missing");
    const ownerId = video?.owner;
    console.log("DELETE-OWNWERID", ownerId)
    console.log("DELETE-USERID", userId)
    console.log(JSON.stringify(userId))
    console.log(JSON.stringify(ownerId))

    if (JSON.stringify(ownerId) !== JSON.stringify(userId))
      throw new ApiError(400, "login with owner id");

    const deleted = await Video.findByIdAndDelete(
      new mongoose.Types.ObjectId(videoId)
    );

    if (video.thumbnailPublicId) {
      deleteFromCloudinary(video.thumbnailPublicId).catch((err) =>
        console.log(err)
      );
    }
    if (video.videoFilePublicId) {
      deleteFromCloudinary(video.videoFilePublicId, "video").catch((err) =>
        console.log(err)
      );
    }
    // console.log(deleted)
    return res
    .status(200)
    .json(
        new ApiResponse(200, {info: `video: ${video.title} is deleted`},"video deleted successfully")
    )
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      status: error?.statusCode || 500,
      message: error?.message || "some eroor in deleting a video",
    });
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    // check if video is present and user is logged in
    // check if the owner is the one who is toggling the status
    // then if all conditions are satisfied then toggle it 
    if(!videoId) throw new ApiError(400, "videoId is absent")

    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(400, "video with this videoId is missing")
    const ownerId = video?.id;

    const userId = req.user?.id
    if(!userId) throw new ApiError(400, "user is not logged in")
    
    const permission = JSON.stringify(userId) == JSON.stringify(ownerId)

    if(!permission) throw new ApiError(400, "for toggling video status login with owner id")

    const updatUser = await Video.findByIdAndUpdate(
      new mongoose.Types.ObjectId(videoId),
      {
        isPublic: video.isPublic? false : true
      },
      {
        new: true
      }
    )

    res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatUser,
        `${video._id} toggle to ${video.isPublic?false:true}`
      )
    )

  } catch (error) {
    res
    .status(error?.status)
    .json(
      {
        status: error?.statusCode||500,
        message:error?.message||"some error in toggling status"
      }
    )
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
