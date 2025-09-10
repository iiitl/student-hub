import dbConnect from "@/lib/dbConnect";
import { NextRequest,NextResponse } from "next/server";
// import {upload} from "@/helpers/multer.middleware"
import {deleteOnCloudinary, uploadOnCloudinary} from "@/helpers/cloudinary"
import Paper from "@/model/paper";
import { verifyJwt } from "@/lib/auth-utils";
import Log from "@/model/logs"
import fs from 'fs/promises'
import path from 'path'
import { tmpdir } from "os";
import { randomUUID } from "crypto";

//Copied from coderabbit because its just a helper
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const uploadIdx = parts.findIndex((p) => p === "upload");
    if (uploadIdx === -1) return null;
    // parts: [..., "<resource_type>", "upload", "v123", "folder", "file.ext"]
    const rest = parts.slice(uploadIdx + 1);
    const withoutVersion = rest[0]?.match(/^v\d+$/) ? rest.slice(1) : rest;
    if (!withoutVersion.length) return null;
    const last = withoutVersion[withoutVersion.length - 1];
    const nameNoExt = last.includes(".")
      ? last.slice(0, last.lastIndexOf("."))
      : last;
    const folder = withoutVersion.slice(0, -1).join("/");
    return folder ? `${folder}/${nameNoExt}` : nameNoExt;
  } catch (e) {
    console.error("Failed to extract public_id from URL:", e);
    return null;
  }
}

export async function DELETE(req:NextRequest,{params}:{params:{id:string}}){
  try {
    await dbConnect();
    
    const paperForDeletion=await Paper.findById(params.id)
    if(!paperForDeletion){
      return NextResponse.json(
        {message:"Paper with given id doesn't exist"},
        {status:404}
      )
    }
    const imageId=paperForDeletion?.document_url
    
    let uploadedPublicId:string|null=null;
    let userId:string|null=null
    const authResponse=await verifyJwt(req)
    if (authResponse.status !== 200) {
    return authResponse;
    }
        
    const authData = await authResponse.json();
    userId = authData.userId as string;

    const roles=authData.roles
    if(userId.toString()!==paperForDeletion?.uploaded_by.toString() && !roles.includes("admin")){
      return NextResponse.json(
        {message:"You are not eligible to delete this post"},
        {status:403}
      )
    }

    const paper=await Paper.findByIdAndDelete(params.id);

    if(imageId){
    const public_id=getPublicIdFromUrl(imageId);
    
    if(public_id==null){
       const log=await Log.create({
        user:userId,
        action:"Paper object deleted",
        paper:null,
        details:"Paper was deleted but cloudinary file deletion failed"
      })
    }
    else{
    const deleteIm=await deleteOnCloudinary(public_id)||await deleteOnCloudinary(public_id);
    //Currently not decided whether to throw error on not if image/pdf on cloudinary not deleted
    if(!deleteIm){
      const log=await Log.create({
        user:userId,
        action:"Paper object deleted",
        paper:null,
        details:"Paper was deleted but cloudinary file deletion failed"
      })
    }}
    }

    await Log.create({
        "user": userId,
        "action": "Paper deletion successful",
        "timestamp": Date.now(),
        "paper":null
    })

    return NextResponse.json(
      {message:"Paper deleted successfully"},
      {status:200}
    )
    } 
    catch (error:any) {
    console.log(error.message)
    return NextResponse.json(
        {message:"Error in paper deletion ",error:error?.message},
        {status:500}
    )
  }
}

export async function GET(req:NextRequest,{params}:{params:{id:string}}){
    try {
        await dbConnect();
        if(!params.id){
            return NextResponse.json(
                {message:"Paper Id is not provided"},
                {status:400}
            )
        }

        const paper=await Paper.findById(params.id);
        if(!paper){
            return NextResponse.json(
                {message:"Paper with given id cannot be found "},
                {status:404}
            )
        }

        return NextResponse.json(
            {message:"Paper fetched successfully",paper},
            {status:200}
        )

    } 
    catch(error:any){
        return NextResponse.json(
            {message:"Error in fetching paper",error:error?.message},
            {status:400}
        )
    }
}

export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){
  try {
    await dbConnect();
    const paper=await Paper.findById(params.id);

    if(!paper){
      return NextResponse.json(
        {message:"Paper deletion failed"},
        {status:404}
      )
    }

    let uploadedPublicId:string|null=null;
    let userId:string|null=null
    const authResponse=await verifyJwt(req)
    if (authResponse.status !== 200) {
    return authResponse;
    }
        
    const authData = await authResponse.json();
    userId = authData.userId as string;
    
    const roles=authData.roles
    if(userId.toString()!==paper?.uploaded_by.toString() && !roles.includes("admin")){
      return NextResponse.json(
        {message:"You are not eligible to update this post"},
        {status:403}
      )
    }

    const formData=await req.formData();
    const entries=Object.fromEntries(formData.entries());
    const allowed_fields=["title", "content", "subject", "year", "term","uploaded_file"]

    const updates:Record<string,any>={};

    for (const key of allowed_fields) {
      if (entries[key]) {
        updates[key] = key === "year" ? Number(entries[key]) : entries[key];
      }
    }
    delete updates.uploaded_file;
    if(updates.year !== undefined){
      updates.year = Number(updates.year);
      if(Number.isNaN(updates.year)){delete updates.year;}
    }

    if(formData.get("uploaded_file")!=null){
    const file=formData.get("uploaded_file") as File 
            //Validate files before buffering
            const maxBytes=25*1024*1024;
            const allowed = new Set(["application/pdf","image/png","image/jpeg","image/webp"]);
            if(!allowed.has(file.type)){
              return NextResponse.json(
                {message:"Unsupported file format"},
                {status:415}
              )
            }
            if((file.size??0)>maxBytes){
              return NextResponse.json(
                {message:"File uploaded is too large"},
                {status:413}
              )
            }
            
            // Convert File → Buffer
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
          
            // Step 1: Save to os temp, sanitize name, with cleanup
            const safeExt = path.extname(file.name || "").replace(/[^.\w]/g, "").slice(0, 10);
            const tempFilePath = path.join(tmpdir(), `paper-${Date.now()}-${randomUUID()}${safeExt}`);
            await fs.writeFile(tempFilePath, buffer);
          
            //Upload to cloudinary
            let cloudinaryResult:any;
            try{
              cloudinaryResult = await uploadOnCloudinary(tempFilePath);
            }
            finally{
              await fs.unlink(tempFilePath).catch(() => {});
            }
            
            if(!cloudinaryResult){
              return NextResponse.json(
              { message: "Failed to upload file to Cloudinary" },
              { status: 500 }
              );
            }
            
            uploadedPublicId=getPublicIdFromUrl(cloudinaryResult.secure_url)

            updates.document_url=cloudinaryResult.secure_url
            const public_id=paper.document_url;
            const deleteImg=await deleteOnCloudinary(public_id)||await deleteOnCloudinary(public_id);
            
            if(!deleteImg){
            const log=await Log.create({
            user:userId,
            action:"Paper object deleted",
            paper:paper._id,
            timestamp:Date.now(),
            details:"Paper was deleted but cloudinary file deletion failed"
            })
            }
      } 

        const updPaper=await Paper.findByIdAndUpdate(
        params.id,
        {
            $set:updates,
            $push:{updated_by:{user:userId, updatedAt:Date.now()}}
        },
        {new:true, runValidators:true}
    )

    if(!updPaper){
        return NextResponse.json(
            {message:"Error in updating paper"},
            {status:500}
        )
    }

    await Log.create({
        user:userId,
        action:"Paper updated successfully",
        paper:paper._id,
        details:"Fields update for paper"
    })

    return NextResponse.json(
        {message:"Paper updated successfully",updPaper},
        {status:200}
    )

  } catch (error:any) {

    return NextResponse.json(
        {message:"Error in updating paper",error:error?.message},
        {status:500}
    )

  }
}




