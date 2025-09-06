import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath){return null;}
        const upload=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        if(fs.existsSync){
        fs.unlinkSync(localFilePath)
        }

        return upload;
    } catch (error) {
        if(fs.existsSync){
        fs.unlinkSync(localFilePath)
        }
        
        console.log("Cloudinary error",error)
    }
}

const deleteOnCloudinary=async(publicId)=>{
    try {
        if(!publicId){return;}
        const delete_file=await cloudinary.uploader.destroy(publicId);
        return delete_file
    } catch (error) {
        console.log("Delete failed")
    }
}

export {uploadOnCloudinary,deleteOnCloudinary}