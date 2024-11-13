import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ThreadsAuth extends Document {
  @Prop({ required: true, unique: true })
  userId: number;

  @Prop({ required: true })
  accessToken: string;

  @Prop()
  expiresAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  // User Profile Data
  @Prop()
  username: string;

  @Prop()
  threadsProfilePictureUrl: string;

  @Prop()
  threadsBiography: string;

  @Prop()
  userProfileUrl: string;

  // Metrics (optional)
  @Prop({ type: Object })
  metrics: {
    views: number;
    likes: number;
    replies: number;
    quotes: number;
    reposts: number;
    followersCount: number;
  };
}

export const ThreadsAuthSchema = SchemaFactory.createForClass(ThreadsAuth);
