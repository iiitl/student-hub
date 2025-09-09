import dbConnect from "@/lib/dbConnect";
import { NextRequest,NextResponse } from "next/server";
// import {upload} from "@/helpers/multer.middleware"
import fs from 'fs/promises'
import path from 'path'
import {deleteOnCloudinary, uploadOnCloudinary} from "@/helpers/cloudinary"
import Paper from "@/model/paper";
import { verifyJwt } from "@/lib/auth-utils";
import Log from "@/model/logs"
import { console } from "inspector";

export const config={
  api:{
    bodyParser:false
  }
}

export async function POST(req: NextRequest){
    try {
        await dbConnect();
        const authResponse=await verifyJwt(req)
        if (authResponse.status !== 200) {
        return authResponse;
        }
        
        const authData = await authResponse.json();
        const userId = authData.userId;

        const formData = await req.formData();

        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const subject = formData.get("subject") as string;
        const year = formData.get("year") as string;
        const term = formData.get("term") as string;
        const file = formData.get("uploaded_file") as File | null;

        if(!title || !content || !subject || !year|| !term || !file){
            const missingFields = []
            if (!title) missingFields.push('title')
            if (!content) missingFields.push('content')
            if (!subject) missingFields.push('subject')
            if (!year) missingFields.push('year')
            if (!term) missingFields.push('term')
            if (!file) missingFields.push('file')
        
            return NextResponse.json(
            { message: `Required fields missing: ${missingFields.join(', ')}` },
            { status: 400 }
            )
        }

        // Convert File → Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

         // Step 1: Save temporarily to local cache
        const uploadDir = path.join(process.cwd(), "public/question_papers");
        await fs.mkdir(uploadDir, { recursive: true });

        const tempFilePath = path.join(uploadDir, `${Date.now()}-${file.name}`);
        await fs.writeFile(tempFilePath, buffer);

        //Upload to cloudinary
        const cloudinaryResult = await uploadOnCloudinary(tempFilePath);

        if (!cloudinaryResult) {
        return NextResponse.json(
        { message: "Failed to upload file to Cloudinary" },
        { status: 500 }
        );
        }
        
        //Create paper object in database
        const paper=await Paper.create({
          title,
          content,
          subject,
          term,
          year,
          document_url:cloudinaryResult.secure_url,
          uploaded_by:userId
        })

        //Create log for paper object
        const logs=await Log.create({
          user:userId,
          action:"Paper upload succeeded",
          paper:paper._id,
          timestamp:Date.now()
        })

        return NextResponse.json(
          {message:"Paper uploaded successfully",paper,logs},
          {status:201}
        )
        
    } catch (error:any) {
        // console.error("Upload error:",error)

        //Create log for error
        await Log.create({
        "user": null,
        "action": "Paper upload failed",
        "error": "Failed to upload file to Cloudinary",
        "timestamp": Date.now(),
        "details":error.stack
        })

        //Validation error separate calling
        if (error.name === "ValidationError") {
        return NextResponse.json(
          { message: "Validation failed", errors: error.errors },
          { status: 400 }
        );
        }

        //Error calling
        return NextResponse.json(
          {message:"Internal server error ",error:error.message},
          {status:500}
        )
    }
}

//Get paper based on query and page limit
export async function GET(req:NextRequest){
  try {
    await dbConnect();
    const {searchParams}=new URL(req.url)
    
    const page=parseInt(searchParams.get("page")||"1",10)
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const query = searchParams.get("query") || "";
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortType = parseInt(searchParams.get("sortType") || "-1", 10);

    //For pipeline so we don't have to write params again and again
    const searchStage:any={};
    if(search && query){
      searchStage[search]={$regex:query, $options:"im"}
    }

    //Pipeline with some user info to keep track of who uploaded what
    const pipeline:any[]=[
      {
        $match:searchStage
      },
      {
        $lookup:{
          from:"users",
          localField:"uploaded_by",
          foreignField:"_id",
          as:"ownerDetails",
          pipeline:[
            {
            $project:{
              name:1
            }
            }
          ]
        }
      },
      {
      $unwind: {
       path: "$ownerDetails",
       preserveNullAndEmptyArrays: true,
       },
      },
    ]
    if(!pipeline){
      return NextResponse.json(
        {message:"Error in creating pipeline"},
        {status:400}
      )
    }

    //Final to aggregate limited queries within a page
    const papers=await (Paper as any).aggregatePaginate(Paper.aggregate(pipeline),{
      page,
      limit,
      sort:{[sortBy]:sortType},
      customLabels:{docs:"papers"}
    })

    if(!papers){
      return NextResponse.json(
        {message:"Error in fetching papers"},
        {status:400}
      )
    }

    return NextResponse.json(
      {message:"Papers fetched succesfully",papers},
      {status:200}
    )

  } catch (error:any) {
    console.error("Fetch posts error",error)
    return NextResponse.json(
      {message:error.message||"Internal Server Error"},
      {status:500}
    )
  }
}
