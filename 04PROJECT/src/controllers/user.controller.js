import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import multer from "multer";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async (userId)=>{
  try{
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()


    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})  // save method is from mongodb it kicks the mongoose data, validateBeforeSave is from mongoose; withot validation saving 


    return {accessToken, refreshToken}
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refersh and access token")
  }
}


const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend- according to User model -details if from form or json  then req.body


  const {fullName, email, username, password} = req.body

  console.log("email:", email);
  console.log("username:", username);
  console.log("fullName:", fullName);
  console.log("password:", password);

  

  //validation - eg wether username, password is empty or not


//   if(fullName === ""){
//     throw new ApiError(400, "fullname is required");
//   }

    if (
        [fullName, email, username, password].some((field)=> field?.trim() === "")
    ) {
        throw new ApiError(400, 'All fields are required')
    } 

  //check if user already exists: username, email
//   User model helps
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }
    // console.log(req.files);

  //check for images, check for avatar
    // req.body holds data but middleware access more 
    // req.body is given by express req.files is by multer
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; works but creates problem not checked before

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // console.log("cover",coverImageLocalPath);



    // console.log("avatarFilePath:",avatarLocalPath);

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

  // upload them to cloudinary - file, check avatar uploaded or not

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log("coverImageLocalPath",coverImageLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    console.log(avatar,"suraz", coverImage);

    if(!avatar) {
        throw new ApiError(400, "avatar file is required")
    }

  //create user object- create entry in db

  const user = await  User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

    
  //remove password and refresh token field from response


  //checking new user is created or not and removing password and refreshToken .select "-" doing removing part
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
console.log(createdUser);
  

  //check for user creation

  if(!createdUser) {
    throw new ApiError(500, "Something went wrong while registering new user")
  }

  //return response if user created
    //json({createdUser }) only also works
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )

});

const loginUser = asyncHandler( async (req, res) => {
  // req.body-> data
  console.log("login-req",req.body);
  const {email, username, password} = req.body
  console.log("login-user",username);
  console.log("login-email",email);
    // if emai or username is not input
  if(!username && !email) {
    throw new ApiError(400, "username or email is required")
  }


  // username || email- login access
  // find the user - user is present or not 
      // username and email is input but not matchichig to stored to data 
      const user = await User.findOne({
        $or :[{username}, {email}]
      })
    
      if(!user) {
        throw new ApiError(404, "User does not exist")
      }
  // if user then password check
      // not capitalize User because findOne updateOne type methods are through mongodb in that case use capitalized if not then var we created i.e user
      const isPasswordValid = await user.isPasswordCorrect(password)

      if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
      }

  // access and refresh token
  const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
  // send token in cookies and allow to log in
      //sending cookies- point that in whose and how send cookie
      // calling db once again coz token was not present in prev data call
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
      // if secure is false then if true then server
    const options = {
      httpOnly: true,
      secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  // loggin out user by removing refresh token
  User.findByIdAndUpdate(
    req.user._id,
    {
      // set gives access to what value to update
      $set:{
        refreshToken: undefined
      },
    },
    {
      // new sets the new value- no need to store
        new: true
      
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  // clearing cookies
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

// refresh accesstoken controller for end point
const refreshAccessToken = asyncHandler(async (req, res)=>{
  // for accessing refresh token -hit cookies
  const incommingRefreshToken = req.cookies.refreshAccessToken || req.body.refreshToken

  if(!incommingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    // verification of tokens
  const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

  const user = await User.findById(decodedToken?._id) //._d is stored in refreshAccessToken

  if(!user){
    throw new ApiError(401, "Invalid refresh token")
  }

  // matching token sent by user-incommingRefreshToken & saved in database refreshToken

  if( incommingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used")
  }
  // generatin new token 
  const options = {
    httpOnly: true,
    secure: true
  }

  const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)

  return res.status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", newRefreshToken, options)
  .json(
    new ApiResponse(
      200,
      {accessToken, refreshToken: newRefreshToken},
      "Access token is refreshed"
    )
  )
  } catch (error) {
    throw new ApiError(401, error?.message)
  }


})

export { registerUser, loginUser, logoutUser, refreshAccessToken };
