import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IProposedChange extends Document {
  changeType: 'add' | 'edit' | 'delete'
  targetType: 'quickread' | 'category'
  status: 'pending' | 'approved' | 'rejected'
  batchId: string
  proposedBy: mongoose.Types.ObjectId
  targetCategoryId?: mongoose.Types.ObjectId
  proposedData?: {
    categoryName?: string
    oldContent?: string
    newContent?: string
  }
  reviewedBy?: mongoose.Types.ObjectId
  reviewNote?: string
  createdAt: Date
  updatedAt: Date
}

const ProposedChangeSchema = new Schema<IProposedChange>(
  {
    changeType: {
      type: String,
      required: true,
      enum: ['add', 'edit', 'delete'],
    },
    targetType: {
      type: String,
      required: true,
      enum: ['quickread', 'category'],
      default: 'category',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    batchId: {
      type: String,
      required: true,
      index: true,
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    proposedData: {
      categoryName: String,
      oldContent: String,
      newContent: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: [300, 'Review note cannot exceed 300 characters'],
    },
  },
  {
    timestamps: true,
  }
)

// Force-delete cached model during dev hot reload
if (mongoose.models.ProposedChange) {
  delete mongoose.models.ProposedChange
}

const ProposedChange: Model<IProposedChange> =
  mongoose.model<IProposedChange>('ProposedChange', ProposedChangeSchema)

export default ProposedChange
