import mongoose,{Schema,Document,Model, mongo} from "mongoose";

export interface IPaper extends Document{
    title:string,
    content:string,
    subject:string,
    year:Date,
    term:string,
    document_url?:string,
    uploaded_by?:string
}

const PaperSchema: Schema<IPaper> = new Schema<IPaper>(
    {
        title:{
            type:String,
            required:[true,"Title of question paper is required"],
            trim:true,
            maxlength:[100,"Title must be withing 100 words"]
        },
        content:{
            type:String,
            required:[true,"A brief description of the paper you want to upload is necessary"],
            trim:true
        },
        subject:{
            type:String,
            required:[true,"Please enter subject name for given paper"],
            trim:true
        },
        year:{
            type:Date,
            required:[true,"Year of question paper is necessary"],
            max:new Date().getFullYear()
        },
        term:{
            type:String,
            enum:["Mid","End","Class_test_1","Class_test_2","Class_test_3"],
            required:[true,"Term of exam is required"]
        },
        document_url:{
            type:String,
            required:[true,"Document url is required for paper"]
        },
        uploaded_by:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
            index:true
        }
    },{timestamps:true}
)

const Paper: Model<IPaper>=
    mongoose.models.Paper||mongoose.model<IPaper>('Paper',PaperSchema)

export default Paper;