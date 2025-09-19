import mongoose,{Schema,Document,Model} from "mongoose";
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export interface IPaperUpdate{
    user:Schema.Types.ObjectId,
    updatedAt:Date
}

export interface IPaper extends Document{
    title:string,
    content:string,
    subject:string,
    year:Number,
    term:string,
    document_url:string,
    uploaded_by:Schema.Types.ObjectId,
    updated_by:IPaperUpdate[]
}

const PaperSchema: Schema<IPaper> = new Schema<IPaper>(
    {
        title:{
            type:String,
            required:[true,"Title of question paper is required"],
            trim:true,
            maxlength:[100,"Title must be withing 100 characters"]
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
        year: {
          type: Number,
          required: [true, "Year of question paper is necessary"],
          validate: {
            validator: (v: number) =>
              Number.isInteger(v) && v >= 2015 && v <= new Date().getFullYear(),
            message: "Year must be an integer between 2015 and the current year"
          }
        },
        term:{
            type:String,
            enum:["Mid","End","Class_test_1","Class_test_2","Class_test_3"],
            required:[true,"Term of exam is required"],
            set: (v: string) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
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
        },
        updated_by:[
            {
                user:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"User"
                },
                updatedAt:{
                    type:Date,
                    default:Date.now
                }
            }
        ]
    },{timestamps:true}
)

PaperSchema.plugin(aggregatePaginate)

const Paper: Model<IPaper>=
    mongoose.models.Paper||mongoose.model<IPaper>('Paper',PaperSchema)

export default Paper;