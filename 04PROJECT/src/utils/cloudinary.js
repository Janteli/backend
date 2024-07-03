// uploading local server to cloud server- removing file if uploaded to server
//fs- file system already injected in nodejs- removing adding file read
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
// this congiguration user to manipulate file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        console.log('File is uploaded on cloudinary', response.url);
        return response
    }catch(error){
        // if error, file is not uploaded to cloudinary bt still present in local server so it should be removed- locally saved temporary file as the upload operation is failed
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export {uploadOnCloudinary}