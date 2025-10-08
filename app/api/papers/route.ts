import dbConnect from "@/lib/dbConnect";
import { NextRequest,NextResponse } from "next/server";
import fs from 'fs/promises'
import path from 'path'
import {deleteOnCloudinary, uploadOnCloudinary} from "@/helpers/cloudinary"
import Paper from "@/model/paper";
import { verifyJwt } from "@/lib/auth-utils";
import Log from "@/model/logs"
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { getPublicIdFromUrl } from "@/lib/cloudinary-utils";

export const config={
  api:{
    bodyParser:false
  }
}

export async function POST(req: NextRequest){
    try {
        await dbConnect();
        let uploadedPublicId:string|null=null;
        let userId:string|null=null
        const authResponse=await verifyJwt(req)
        if (authResponse.status !== 200) {
        return authResponse;
        }
        
        const authData = await authResponse.json();
        userId = authData.userId as string;

        const formData = await req.formData();

        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const subject = formData.get("subject") as string;
        const yearRaw = formData.get("year") as string;
        const year = parseInt(yearRaw ?? "", 10);
        if (Number.isNaN(year)) {
        return NextResponse.json({ message: "Invalid year" }, { status: 400 });
        }

        const term = formData.get("term") as string;
        const file = formData.get("uploaded_file") as File | null;

        if(!title || !content || !subject || !year|| !term || !file){
            const missingFields = []
            if (!title?.trim()) missingFields.push('title')
            if (!content?.trim()) missingFields.push('content')
            if (!subject?.trim()) missingFields.push('subject')
            if (!year) missingFields.push('year')
            if (!term?.trim()) missingFields.push('term')
            if (!file) missingFields.push('file')
        
            return NextResponse.json(
            { message: `Required fields missing: ${missingFields.join(', ')}` },
            { status: 400 }
            )
        }

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
    const rawSortType = parseInt(searchParams.get("sortType") || "-1", 10);
    const sortType = rawSortType === 1 ? 1 : -1;
    const subjectFilter = searchParams.get("subject");
    const termFilter = searchParams.get("term");
    const yearFilter = searchParams.get("year");

    //For pipeline so we don't have to write params again and again
    const match: any = {};
    if(subjectFilter){
      match.subject={$regex:`^${subjectFilter}$`,$options:"i"};
    }
    if(termFilter){
      match.term={$regex:`^${termFilter}$`,$options:"i"};
    }
    if(yearFilter){
      const y=parseInt(yearFilter, 10);
      if(!Number.isNaN(y)) match.year = y;
    }
    if(search && query){
      match[search]={$regex:query,$options:"i"};
    }
    

    //Pipeline with some user info to keep track of who uploaded what
    const pipeline:any[]=[
      {
        $match:match
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
              name:1,
              email:1
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
    return NextResponse.json(
      {message:error.message||"Internal Server Error"},
      {status:500}
    )
  }
}
