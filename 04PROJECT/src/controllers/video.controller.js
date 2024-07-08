import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import fs from "fs"


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
        const {page, limit, query, sortBy, userId, username} = req.query

        const pageOptions = {
            page: Number(page) || 0,
            limit: Number(limit) || 10
        }

        let pipelineArr =[
            {
                $match:{
                    isPublic: tru
                }
            },{
                $lookup:{
                    from: "likes",
                    localField: "_id",
                    foreginField: "video",
                    as: "likes"
                }
            },{
                $addFields:{
                    likes: {$size: {$ifNull: ["$likes", []]}}
                }
            }
        ]


        pipelineArr.push(
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreginField:"_id",
                    as:"channel"
                }
            }
        )

        pipelineArr.push(
            {
                $unwind: "$channel"
            }
        )
        // TODO: think of matching channel also
        pipelineArr.push(
            {
                $project:{
                    _id : 1,
                    owner: 1,
                    videoFile: 1,
                    thumbnail :1,
                    title: 1,
                    duration: 1,
                    views: 1,
                    channelId: "$channel._id",
                    channel:"$channel.username",
                    channelFullName:"$channel.fullName",
                    channelAvatar:"$channel.avatar",
                    createAt:1,
                    likes:1,
                    description:1
                }
            }
        )
        if(username){
            pipelineArr.push({
                $match:{
                    channel:username
                }
            })
        }

        if(query){
            pipelineArr.push(
                {
                    $match:{
                        title:{
                            $regex:query,
                            $options: 'i'
                        }
                    }
                }
            )
        }

        if(username){
            pipelineArr.push(
                {
                    $match:{
                        channel:username
                    }
                }
            )
        }

        if(query){
            pipelineArr.push(
                {
                    $match:{
                        title:{
                            $regex:query,
                            $options: 'i'
                        }
                    }
                }
            )
        }

        if(sortBy){
            if(sortType === "ascending") {
                // oldest in case of createAt
                pipelineArr.push(
                    {
                        $sort: {
                            [sortBy]:1
                        }
                    }
                )
            }
        }

        if(sortType== 'descending'){
            // newest in case of createdAt
            pipelineArr.push(
                {
                    $sort: {
                        [sortBy]: -1
                    }
                }
            )
        }

        if(userId){
            pipelineArr.push(
                {
                    $match:{
                        owner : new mongoose.Types.ObjectId(userId)
                    }
                }
            )
        }

        const result = await Video.aggregate(pipelineArr)
        .skip(pageOptions.limit*pageOptions.page)
        .limit(pageOptions.limit)

        res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result,
                "videos fetched successfully"
            )
        )
    } catch( error ){
        res
        .status(error?.statusCode || 500)
        .json({
            status: error?.statusCode||500,
            message: error?.message||"some error in querying videos"
        })
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    // get video, upload to cloudinary, createvideo
    // req.user- user, check if there or not
    // title, decription, check if there not
    // upload file on multer, check if there or not
    // local path from multer and upload it on cloudinary
    // find video length etc from cloudinary
    // if there is anything in is public then also update that
    // TODO: get video, upload to cloudinary, create video
    try{
        const { title, description, thumbnail } = req.body


        console.log("video:", title, description)

        if(!req.files.videoFile || !req.files.thumbnail){
            if(req.files.videoFile){
                fs.unlinkSync(req.files?.videoFile[0]?.path)
            }
            if(req.files.thumbnail){
                fs.unlinkSync(req.files?.thumbnail[0]?.path)
            }
            throw new ApiError(401, "Either videofile or thumbnail is missing")
        }

        const videoFileLocalPath = req.files?.videoFile[0]?.path;
        const thumbnailLocalPath = req.files?.thumbnail[0].path;

        console.log("videoPath",videoFileLocalPath)
        console.log("thumbPath", thumbnailLocalPath);

        const videoUpload = await uploadOnCloudinary(videoFileLocalPath)

        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)

         console.log("thubnail", thumbnailUpload, "AND", videoUpload)

        if(!(thumbnail || videoFile)) throw new ApiError(500, "Uploading error while uploading video or thumbnail")

            const video = await Video.create({
                videoFile: videoUpload.url,
                videoFilePublicId: videoFile.public_id,
                thumbnail: thumbnailUpload.url,
                thumbnailPublicId:thumbnail.public_id,
                title,
                description,
                duration:videoFile.duration,
                isPublic:req.body.isPublic == "false" ? false : true
            })

            console.log("thumbnail", thumbnailUpload, "and", videoUpload)

            // await sendEmail(res, "pubilishedVideo", ownerEmail, video._id, video.title)

            return res
            .status(201)
            .json(new ApiResponse(201, video, "video is published"))
    } catch(error){
        res
        .status(error?.statusCode||500)
        .json({
            status: error?.statusCode||500,
            message:error?.message||"some error in publishng video"
        })
    }
})



const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}