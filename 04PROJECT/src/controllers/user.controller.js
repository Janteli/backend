import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import multer from "multer";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
