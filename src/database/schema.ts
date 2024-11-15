import { Schema, Document } from 'mongoose';
import mongooseAutopopulate from 'mongoose-autopopulate';

export interface Thread extends Document {
  content: string;
  likes: number;
  created_at: Date;
  version: number;
}

export const ThreadSchema = new Schema<Thread>(
  {
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  {
    versionKey: true,
    timestamps: true,
  },
);

ThreadSchema.plugin(mongooseAutopopulate);
