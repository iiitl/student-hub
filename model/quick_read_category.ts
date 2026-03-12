import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ICategory extends Document {
  name: string
  order: number
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    order: {
      type: Number,
      default: 0, // Lower numbers appear first, defaults to 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>('Category', CategorySchema)

export default Category
