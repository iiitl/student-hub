import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ICategory extends Document {
  name: string
  content: string
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
    content: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
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

// Force-delete cached model during dev hot reload
if (mongoose.models.Category) {
  delete mongoose.models.Category
}

const Category: Model<ICategory> =
  mongoose.model<ICategory>('Category', CategorySchema)

export default Category
