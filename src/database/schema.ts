import { Schema, Document } from 'mongoose';
import { Int32 } from 'mongoose-int32';
import autopopulate from 'mongoose-autopopulate';

export interface Thread extends Document {
  content: string;
  likes: number;
  created_at: Date;
  version: number;
}

export const ThreadSchema = new Schema<Thread>(
  {
    content: { type: String, required: true },
    likes: { type: Int32, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  {
    versionKey: true,
    timestamps: true,
  },
);

ThreadSchema.plugin(autopopulate as any);
