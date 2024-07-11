import mongoose, {isValidObjectId, mongo} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
//TODO: create playlist
try {
    const {name, description, isPublic = true} = req.body
    console.log("PLAYLIST-CREATE", name, description);
    if(!name || !description) throw new ApiError(400, "enter both name and description of playlist")
    
    const ownerId = req.user?._id;

    if(!ownerId) throw new ApiError(400, "user should log in")
    
    const playlist = await Playlist.create({
        name,
        description,
        owner:ownerId,
        isPublic
    })

    res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "playlist is created")
    )
} catch (error) {
    res
    .status(error?.statusCode||500)
    .json({
        status:error?.statusCode||500,
        message:error?.message||"some error in creating playlist",
        orginOfError:"playlist controller"
    })
}
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    try {
        const {userId} = req.params
    //TODO: get user playlists

    if(!userId) throw new ApiError(400,"userId is absent")

    const playlists = await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        }
    ])
    res
    .status(200)
    .json(
        new ApiResponse(200, playlists, "playlists fetched")
    )
    } catch (error) {
        res
        .status(error?.statusCode||500)
        .json(
            {
                status:error?.statusCode||500,
                message:error?.message||"some error in fetching a users playlists",
                originOfError:"playlist controller"
            }
        )
    }

   
})

const getUserPlaylistsByUsername = asyncHandler(async (req, res)=>{})

const getCurrentPlaylist = asyncHandler(async (req, res)=>{})

const togglePlaylistAccess = asyncHandler(async (req, res)=>{})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getUserPlaylistsByUsername,
    getCurrentPlaylist,
    togglePlaylistAccess
}