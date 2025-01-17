import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  try {
    // get all comments for a video
    const { videoId } = req.params;
    // console.log(videoId)
    const { page, limit, ascending = "false" } = req.query;
    // console.log("COMMENTS", ascending)

    // if sortType == 1 then show the newest comment
    // else show the most liked comment
    // ascending == true

    const pageOptions = {
      page: parseInt(page, 10) || 0,
      limit: parseInt(limit, 10) || 15,
    };

    if (!videoId) throw new ApiError(400, "video id is absent");

    const userId = req.user?._id;
    // console.log(userId)
    // no point of checking for video further database calls

    const comments = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
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
        $unwind: "$owner",
      },
      {
        $project: {
          _id: 1,
          content: 1,
          video: 1,
          owner: 1,
          createdAt: 1,
          ownerUsername: "$owner.username",
          ownerAvatar: "$owner.avatar",
          owner: "$owner._id",
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "comment",
          as: "likes",
        },
      },
      {
        $addFields: {
          isEditable: {
            $eq: [new mongoose.Types.ObjectId(userId), "$owner"],
          },
          isLiked: {
            $in: [new mongoose.Types.ObjectId(userId), "$likes.likedBy"],
          },

          likes: {
            $size: "$likes",
          },
        },
      },
      {
        sort: ascending === "true" ? { createdAt: -1 } : { likes: -1 },
      },
    ])
    .skip(pageOptions.page = pageOptions.limit).limit(pageOptions.limit)

    // things to add user info from lookup
    // likes count from lookup
    // console.log(comments)

    if(comments.length == 0) return res.status(200).json(
        new ApiError(
            new ApiResponse(
                200,
                [],
                "no comments found"
            )
        )
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "comments fetched successfully"
        )
    )
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      status: error?.statusCode || 500,
      message: error?.message || "some error while getting video comments",
      originOfError: "comment controller",
    });
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  try {
    const { videoId } = req.params;
    const owner = req.user?._id;
    const { content } = req.body;

    console.log("COMMENT-CONTENT", content);
    console.log("COMMMENT-REQ", req.body);
    console.log("COMMENT-OWNER", owner);

    console.log("COMMENT", videoId);
    console.log("COMMENT-CONTENT", content);

    if (!owner) throw new ApiError(400, "login to post comment");
    if (!content) throw new ApiError(400, "cant post comment without content");
    if (!videoId) throw new ApiError(400, "video id is not present");
    const video = await Video.aggregate([
      {
        $match: {
          isPublic: true,
        },
      },
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
        },
      },
    ]);

    if (!video) throw new ApiError(404, "video with this id is not available");

    const comment = await Comment.create({
      content,
      video: videoId,
      owner,
    });

    res.status(200).json(new ApiResponse(200, comment, "comment is posted"));
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      status: error?.statusCode || 500,
      message: error?.message || "some error while creating comments",
      originOfError: "comment controller went wrong",
    });
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  try {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!userId) throw new ApiError(400, "login to delete comment");

    if (!commentId) throw new ApiError(400, "comment id is not present");

    const comment = await Comment.findById(commentId);

    if (!comment)
      throw new ApiError(404, "comment with this id is not present");

    const permission = JSON.stringify(comment.owner) == JSON.stringify(userId);

    if (!permission) throw new ApiError(400, "login with owner id");

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          deleteComment: commentId,
          success: true,
        },
        "comment deleted"
      )
    );
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      status: error?.statusCode || 500,
      message: error?.message || "some error while deleting video comments",
      originOfError: "comment controller final catch error",
    });
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
