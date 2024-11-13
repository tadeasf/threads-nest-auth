import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ThreadsInsights extends Document {
  @Prop({ required: true })
  userId: number;

  @Prop({ type: Object })
  metrics: {
    views: number;
    likes: number;
    replies: number;
    quotes: number;
    reposts: number;
    followersCount: number;
  };

  @Prop()
  since: Date;

  @Prop()
  until: Date;
}

export const ThreadsInsightsSchema =
  SchemaFactory.createForClass(ThreadsInsights);
