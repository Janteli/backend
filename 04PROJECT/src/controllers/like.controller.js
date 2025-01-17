import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log("LIKEVIDEO", videoId);
    //TODO: toggle like on video
    const user = req.user?._id;

    console.log("toggleVideoLike", user);
    if (!videoId) throw new ApiError(400, "video id is missing");

    let like = await Like.findOne({
      video: new mongoose.Types.ObjectId(videoId),
      likedBy: new mongoose.Types.ObjectId(user),
    });

    if (!like) {
      like = await Like.create({
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: new mongoose.Types.ObjectId(user),
      });
    } else {
      const deleteLike = await Like.deleteOne({
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: new mongoose.Types.ObjectId(user),
      });

      res
        .status(200)
        .json(new ApiResponse(200, deleteLike, "video liked is removed"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, like, "video liked successfully"));
  } catch (error) {}
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const user = req.user?._id;

    if (!commentId) throw new ApiError(400, "video id is missing");

    let like = await Like.findOne({
      comment: new mongoose.Types.ObjectId(commentId),
      likedBy: new mongoose.Types.ObjectId(user),
    });

    if (!like) {
      like = await Like.create({
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(user),
      });

      res
        .status(200)
        .json(new ApiResponse(200, like, "comment liked successfully"));
    } else {
      const deleteLike = await Like.deleteOne({
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(user),
      });
      res
        .status(200)
        .json(
          new ApiResponse(200, deleteLike, "comment liked removed successfully")
        );
    }
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      status: error?.statusCode || 500,
      message: error?.message || "some error while liking comment",
      originOfError: "like controller",
    });
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  try {
    const { tweetId } = req.params;
    const user = req.user?._id;

    if (!tweetId) throw new ApiError(400, "video is missing");
    let like = await Like.findOne({
      tweet: new mongoose.Types.ObjectId(tweetId),
      likedBy: new mongoose.Types.ObjectId(user)
    });

    if(!like){
        like = await Like.create({
            tweet: new mongoose.Types.ObjectId(tweetId),
            likedBy: new mongoose.Types.ObjectId(user)
        })
        res.status(200)
        .json(
            new ApiResponse(
                200,
                like,
                "tweet liked successfully"
            )
        )
    } else {
        const deleteLike = await Like.deleteOne(
            {
                tweet: new mongoose.Types.ObjectId(tweetId),
                likedBy: new mongoose.Types.ObjectId(user)
            }
        )
        res.status(200)
        .json(
            new ApiResponse(
                200,
                deleteLike,
                "tweet liked removed successfully"
            )
        )
    }
  } catch (error) {
    res.status(error?.statusCode || 500).json({
      status: error?.statusCode || 500,
      message: error?.message || "some error while liking a tweet",
      originOfError: "like controller",
    });
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        const user = req.user?._id;

        console.log("GETLIKEDVIDEOS", user);
        if(!user)  return res.status(400).json({ status: 400, message: "Invalid or missing user ID" });
        const likedVideos = await Like.aggregate([
            {
                $match:{
                    likedBy: new mongoose.Types.ObjectId(user)
                },
               
            },
            {
                $match:{
                    video:{
                        $exists:true,
                        $ne:""
                    }
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"video",
                    foreignField:"_id",
                    as:"video",
                    pipeline:[
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner"
                            }
                        }
                        // can also write unwind here withpath of array as $owner
                    ]
                }
            }, 
            {
                $unwind:{
                    path:"$video"
                }
            },
            {
                $unwind:{
                    path:"$video.owner"
                }
            },
            {
                $project:{
                    _id:"$_id",
                    videoFile: "$video.videoFile",
                    thumbnail:"$video.thumbnail",
                    title:"$video.title",
                    duration:"$video.duration",
                    views:"$video.views",
                    createdAt:"$video.createdAt",
                    description:"$video.description",
                    channel:"$video.owner.username",
                    channelFullName:"$video.owner.fullName",
                    channelAvatar:"$video.owner.avatar",
                    channelId:"$video.owner._id"
                }
            }
        ])

        if(likedVideos.length == 0){
            return res.status(200)
            .json(
                new ApiResponse(200,{
                    data:[]
                }, "no liked videos")
            )
        }
        res.status(200)
        .json(
            new ApiResponse(200,
                likedVideos,
                "videos liked by user are fetched"
            )
        )
    } catch (error) {
        res.status(error?.statusCode||500)
        .json({
            status:error?.statusCode||500,
            message:error?.message||"some error while getting liked videos"
        })
    }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
