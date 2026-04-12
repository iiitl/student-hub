import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IReply {
  _id?: mongoose.Types.ObjectId
  user: Schema.Types.ObjectId
  text: string
  createdAt: Date
}

export interface IComment {
  _id?: mongoose.Types.ObjectId
  user: Schema.Types.ObjectId
  text: string
  offerPrice?: number
  createdAt: Date
  replies: IReply[]
}

export interface IProduct extends Document {
  title: string
  description: string
  price: number
  quantity: number
  image_url: string
  contact_info: string
  seller: Schema.Types.ObjectId
  is_sold: boolean
  show_when_sold: boolean
  comments: IComment[]
  created_at: Date
}

const ProductSchema: Schema<IProduct> = new Schema<IProduct>({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [40, 'Title cannot exceed 40 characters'],
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  quantity: {
    type: Number,
    default: 1,
    min: [0, 'Quantity cannot be negative'],
  },

  image_url: {
    type: String,
    required: [true, 'Product image is required'],
    validate: {
      validator: function (v: string) {
        return v.startsWith('https://')
      },
      message: 'Image URL must be HTTPS',
    },
  },
  contact_info: {
    type: String,
    required: [true, 'Contact information is required'],
    trim: true,
    maxlength: [200, 'Contact info cannot exceed 200 characters'],
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  is_sold: {
    type: Boolean,
    default: false,
  },
  show_when_sold: {
    type: Boolean,
    default: false,
  },
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      text: { type: String, required: true, maxlength: 1000 },
      offerPrice: { type: Number },
      createdAt: { type: Date, default: Date.now },
      replies: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          text: { type: String, required: true, maxlength: 500 },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
})

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)

export default Product
