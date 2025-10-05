import {v2 as cloudinary,UploadApiResponse} from "cloudinary";
import fs from "fs";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

// Allow build to pass without cloudinary config, but warn
if(!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("Missing Cloudinary configuration (CLOUDINARY_* env vars).");
  } else {
    console.warn("Warning: Missing Cloudinary configuration. Upload/delete operations will fail.");
  }
}

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary=
    async(localFilePath:string)
    :Promise<UploadApiResponse|null> =>{
    if(!localFilePath){return null;}
    try {
        const upload=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        return upload;
    } catch (error) {
        console.log("Cloudinary error",error)
        throw error
    }
    finally{
        try {
          if(localFilePath && fs.existsSync(localFilePath)) {
            await fs.promises.unlink(localFilePath);
          }
        } catch(e){
          console.warn("Failed to remove temp file:", localFilePath);
        }
    }
}

const deleteOnCloudinary=async(publicId:string)
:Promise<any> =>{
    if(!publicId){return null;}
    try {
        const delete_file=await cloudinary.uploader.destroy(publicId,{invalidate:true});
        return delete_file
    } catch (error:any) {
        console.log("Cloudinary Delete failed ",error?.message||error)
        throw error;
    }
}

export {uploadOnCloudinary,deleteOnCloudinary}