import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ThreadsAuth extends Document {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  username: string;

  @Prop()
  profilePicture: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop({ required: true, default: Date.now })
  lastUpdated: Date;
}

export const ThreadsAuthSchema = SchemaFactory.createForClass(ThreadsAuth);
