import dbConnect from "@/lib/dbConnect";
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises'
import path from 'path'
import { uploadOnCloudinary } from "@/helpers/cloudinary"
import Paper from "@/model/paper";
import { verifyJwt } from "@/lib/auth-utils";
import Log from "@/model/logs"
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import User from "@/model/User";

//TODO: fix all Lints to proper types.

export const config = {
  api: {
    bodyParser: false
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    let userId: string | null = null
    const authResponse = await verifyJwt(req)
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const authData = await authResponse.json();
    userId = authData.userId as string;

    const formData = await req.formData();

    const facultyName = formData.get("facultyName") as string;
    const content = formData.get("content") as string;
    const subject = formData.get("subject") as string;
    const yearRaw = formData.get("year") as string;
    const year = parseInt(yearRaw ?? "", 10);
    if (Number.isNaN(year)) {
      return NextResponse.json({ message: "Invalid year" }, { status: 400 });
    }

    const semesterRaw = formData.get("semester") as string;
    const semester = parseInt(semesterRaw ?? "", 10);
    if (Number.isNaN(semester)) {
      return NextResponse.json({ message: "Invalid semester" }, { status: 400 });
    }

    const term = formData.get("term") as string;
    const file = formData.get("uploaded_file") as File | null;

    if (!content || !subject || !year || !semester || !term || !file) {
      const missingFields = []
      // if (!facultyName?.trim()) missingFields.push('facultyName') // Optional now
      if (!content?.trim()) missingFields.push('content')
      if (!subject?.trim()) missingFields.push('subject')
      if (!year) missingFields.push('year')
      if (!semester) missingFields.push('semester')
      if (!term?.trim()) missingFields.push('term')
      if (!file) missingFields.push('file')

      return NextResponse.json(
        { message: `Required fields missing: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    //Validate files before buffering
    const maxBytes = 25 * 1024 * 1024;
    const allowed = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
    if (!allowed.has(file.type)) {
      return NextResponse.json(
        { message: "Unsupported file format" },
        { status: 415 }
      )
    }
    if ((file.size ?? 0) > maxBytes) {
      return NextResponse.json(
        { message: "File uploaded is too large" },
        { status: 413 }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cloudinaryResult: any;
    try {
      cloudinaryResult = await uploadOnCloudinary(tempFilePath);
    }
    finally {
      await fs.unlink(tempFilePath).catch(() => { });
    }

    if (!cloudinaryResult) {
      return NextResponse.json(
        { message: "Failed to upload file to Cloudinary" },
        { status: 500 }
      );
    }


    //Create paper object in database
    const paper = await Paper.create({
      facultyName,
      content,
      subject,
      semester,
      term,
      year,
      document_url: cloudinaryResult.secure_url,
      file_name: file.name,
      file_type: file.type,
      uploaded_by: userId
    })

    //Create log for paper object
    const logs = await Log.create({
      user: userId,
      action: "Paper upload succeeded",
      paper: paper._id,
    })

    return NextResponse.json(
      { message: "Paper uploaded successfully", paper, logs },
      { status: 201 }
    )

  } catch (error: unknown) {
    // console.error("Upload error:",error)

    //Create log for error
    await Log.create({
      "user": null,
      "action": "Paper upload failed",
      "error": "Failed to upload file to Cloudinary",
      "details": error instanceof Error ? error.stack : 'Unknown error'
    })

    //Validation error separate calling
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { message: "Validation failed", errors: (error as any).errors },
        { status: 400 }
      );
    }

    //Error calling
    return NextResponse.json(
      { message: "Internal server error ", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

//Get paper based on query and page limit (Public - no auth required)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "1", 10)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match: any = {};
    if (subjectFilter) {
      match.subject = { $regex: `^${subjectFilter}$`, $options: "i" };
    }
    if (termFilter) {
      match.term = { $regex: `^${termFilter}$`, $options: "i" };
    }
    if (yearFilter) {
      const y = parseInt(yearFilter, 10);
      if (!Number.isNaN(y)) match.year = y;
    }
    if (search && query) {
      match[search] = { $regex: query, $options: "i" };
    }


    //Pipeline with some user info to keep track of who uploaded what
    const pipeline = [
      {
        $match: match
      },
      {
        $lookup: {
          from: "users",
          localField: "uploaded_by",
          foreignField: "_id",
          as: "ownerDetails",
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1
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
    if (!pipeline) {
      return NextResponse.json(
        { message: "Error in creating pipeline" },
        { status: 400 }
      )
    }

    //Final to aggregate limited queries within a page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const papers = await (Paper as any).aggregatePaginate(Paper.aggregate(pipeline), {
      page,
      limit,
      sort: { [sortBy]: sortType },
      customLabels: { docs: "papers" }
    })

    if (!papers) {
      return NextResponse.json(
        { message: "Error in fetching papers" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "Papers fetched succesfully", papers },
      { status: 200 }
    )

  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}

//Delete paper (Only uploader or technical club admin)
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResponse = await verifyJwt(req);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const authData = await authResponse.json();
    const userId = authData.userId as string;

    // Get paper ID from query params
    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get("id");

    if (!paperId) {
      return NextResponse.json(
        { message: "Paper ID is required" },
        { status: 400 }
      );
    }

    // Fetch the paper
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return NextResponse.json(
        { message: "Paper not found" },
        { status: 404 }
      );
    }

    // Fetch user details to check email
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check authorization: either the uploader or technicalclub@iiitl.ac.in
    const isUploader = paper.uploaded_by.toString() === userId;
    const isTechnicalClub = user.email === "technicalclub@iiitl.ac.in";

    if (!isUploader && !isTechnicalClub) {
      return NextResponse.json(
        { message: "You are not authorized to delete this paper" },
        { status: 403 }
      );
    }

    // Delete the paper
    await Paper.findByIdAndDelete(paperId);

    // Create log
    await Log.create({
      user: userId,
      action: "Paper deleted",
      paper: paperId,
      details: `Paper "${paper.facultyName}" deleted by ${user.email}`
    });

    return NextResponse.json(
      { message: "Paper deleted successfully" },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("Delete error:", error);

    // Create log for error
    await Log.create({
      user: null,
      action: "Paper deletion failed",
      error: "Failed to delete paper",
      details: error instanceof Error ? error.stack : 'Unknown error'
    });

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

//Update paper (Only uploader or technical club admin)
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResponse = await verifyJwt(req);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    const authData = await authResponse.json();
    const userId = authData.userId as string;

    // Get paper ID from query params
    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get("id");

    if (!paperId) {
      return NextResponse.json(
        { message: "Paper ID is required" },
        { status: 400 }
      );
    }

    // Get update data from request body
    const body = await req.json();
    const { facultyName, content, subject, year, semester, term } = body;

    // Validate that at least one field is being updated
    if (!facultyName && !content && !subject && !year && !semester && !term) {
      return NextResponse.json(
        { message: "At least one field must be provided for update" },
        { status: 400 }
      );
    }

    // Fetch the paper
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return NextResponse.json(
        { message: "Paper not found" },
        { status: 404 }
      );
    }

    // Fetch user details to check email
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check authorization: either the uploader or technicalclub@iiitl.ac.in
    const isUploader = paper.uploaded_by.toString() === userId;
    const isTechnicalClub = user.email === "technicalclub@iiitl.ac.in";

    if (!isUploader && !isTechnicalClub) {
      return NextResponse.json(
        { message: "You are not authorized to edit this paper" },
        { status: 403 }
      );
    }

    // Prepare update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (facultyName) updateData.facultyName = facultyName;
    if (content) updateData.content = content;
    if (subject) updateData.subject = subject;
    if (year) {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum)) {
        return NextResponse.json(
          { message: "Invalid year" },
          { status: 400 }
        );
      }
      updateData.year = yearNum;
    }
    if (semester) {
      const semesterNum = parseInt(semester, 10);
      if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
        return NextResponse.json(
          { message: "Invalid semester (must be 1-8)" },
          { status: 400 }
        );
      }
      updateData.semester = semesterNum;
    }
    if (term) {
      const validTerms = ["Mid", "End", "Class_test_1", "Class_test_2", "Class_test_3"];
      if (!validTerms.includes(term)) {
        return NextResponse.json(
          { message: "Invalid term" },
          { status: 400 }
        );
      }
      updateData.term = term;
    }

    // Add to update history
    updateData.$push = {
      updated_by: {
        user: userId,
        updatedAt: new Date()
      }
    };

    // Update the paper
    const updatedPaper = await Paper.findByIdAndUpdate(
      paperId,
      updateData,
      { new: true, runValidators: true }
    );

    // Create log
    await Log.create({
      user: userId,
      action: "Paper updated",
      paper: paperId,
      details: `Paper "${paper.facultyName}" updated by ${user.email}`
    });

    return NextResponse.json(
      { message: "Paper updated successfully", paper: updatedPaper },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("Update error:", error);

    // Create log for error
    await Log.create({
      user: null,
      action: "Paper update failed",
      error: "Failed to update paper",
      details: error instanceof Error ? error.stack : 'Unknown error'
    });

    // Validation error separate handling
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { message: "Validation failed", errors: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
