import mongoose, { Model } from "mongoose";

interface ILocation {
  name: string
  category: string
  address: string
  location: string
  contact?: string
  website?: string
  added_at?: Date
}


const LocationSchema = new mongoose.Schema<ILocation>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  address: { type: String, required: true },
  location: { type: String, required: true },
  contact: { type: String },
  website: { type: String },
  added_at: { type: Date, default: Date.now }
});

const Location: Model<ILocation> =
  mongoose.models.Location || mongoose.model<ILocation>("Location", LocationSchema)

export default Location

