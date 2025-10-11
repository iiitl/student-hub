import {v2 as cloudinary,UploadApiResponse} from "cloudinary";
import fs from "fs";

// TODO : Fix all lints to proper types.

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
        } catch{
          console.warn("Failed to remove temp file:", localFilePath);
        }
    }
}


const deleteOnCloudinary=async(publicId:string)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
:Promise<any> =>{
    if(!publicId){return null;}
    try {
        const delete_file=await cloudinary.uploader.destroy(publicId,{invalidate:true});
        return delete_file
    } catch (error: unknown) {
        console.log("Cloudinary Delete failed ", error instanceof Error ? error.message : error)
        throw error;
    }
}

export {uploadOnCloudinary,deleteOnCloudinary}