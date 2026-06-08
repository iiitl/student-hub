import { Document, Schema, model } from 'mongoose';

interface INote extends Document {
  title: string;
  content: string;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  fileUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Note = model<INote>('Note', noteSchema);

export { Note, INote };