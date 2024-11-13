import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadsAuth } from '../auth/schemas/threads-auth.schema';
import { ThreadsInsights } from './schemas/threads-insights.schema';
import axios from 'axios';

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name);
  private readonly graphApiBaseUrl = 'https://graph.threads.net/v1';

  constructor(
    @InjectModel(ThreadsAuth.name)
    private threadsAuthModel: Model<ThreadsAuth>,
    @InjectModel(ThreadsInsights.name)
    private threadsInsightsModel: Model<ThreadsInsights>,
  ) {}

  async getUserProfile(userId: number) {
    const auth = await this.threadsAuthModel.findOne({ userId });
    if (!auth) throw new Error('User not found');

    try {
      const response = await axios.get(`${this.graphApiBaseUrl}/me`, {
        params: {
          fields: 'username,threads_profile_picture_url,threads_biography',
          access_token: auth.accessToken,
        },
      });

      const profileData = response.data;

      // Update stored profile data
      await this.threadsAuthModel.findOneAndUpdate(
        { userId },
        {
          username: profileData.username,
          threadsProfilePictureUrl: profileData.threads_profile_picture_url,
          threadsBiography: profileData.threads_biography,
          userProfileUrl: `https://www.threads.net/@${profileData.username}`,
        },
        { new: true },
      );

      return profileData;
    } catch (error) {
      this.logger.error(`Error fetching user profile: ${error.message}`);
      throw error;
    }
  }

  async createPost(
    userId: number,
    data: {
      text?: string;
      mediaUrl?: string;
      mediaType?: 'IMAGE' | 'VIDEO';
      altText?: string;
      linkAttachment?: string;
      replyControl?: 'FOLLOWING' | 'MENTIONED' | 'EVERYONE';
    },
  ) {
    const auth = await this.threadsAuthModel.findOne({ userId });
    if (!auth) throw new Error('User not found');

    try {
      const response = await axios.post(
        `${this.graphApiBaseUrl}/me/threads`,
        {
          text: data.text,
          media_type: data.mediaType,
          media_url: data.mediaUrl,
          alt_text: data.altText,
          link_attachment_url: data.linkAttachment,
          reply_control: data.replyControl,
        },
        {
          params: {
            access_token: auth.accessToken,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error creating post: ${error.message}`);
      throw error;
    }
  }

  async getUserPosts(userId: number, limit = 10) {
    const auth = await this.threadsAuthModel.findOne({ userId });
    if (!auth) throw new Error('User not found');

    try {
      const response = await axios.get(`${this.graphApiBaseUrl}/me/threads`, {
        params: {
          fields: 'id,text,media_type,permalink,timestamp,reply_audience',
          limit,
          access_token: auth.accessToken,
        },
      });

      return response.data.data;
    } catch (error) {
      this.logger.error(`Error fetching user posts: ${error.message}`);
      throw error;
    }
  }

  async getPostReplies(userId: number, threadId: string, limit = 10) {
    const auth = await this.threadsAuthModel.findOne({ userId });
    if (!auth) throw new Error('User not found');

    try {
      const response = await axios.get(
        `${this.graphApiBaseUrl}/${threadId}/replies`,
        {
          params: {
            fields:
              'text,media_type,media_url,permalink,timestamp,username,hide_status,alt_text',
            limit,
            access_token: auth.accessToken,
          },
        },
      );

      return response.data.data;
    } catch (error) {
      this.logger.error(`Error fetching post replies: ${error.message}`);
      throw error;
    }
  }

  async getUserInsights(userId: number, since?: Date, until?: Date) {
    const auth = await this.threadsAuthModel.findOne({ userId });
    if (!auth) throw new Error('User not found');

    try {
      const response = await axios.get(
        `${this.graphApiBaseUrl}/me/threads_insights`,
        {
          params: {
            metric: 'views,likes,replies,quotes,reposts,followers_count',
            since: since?.toISOString(),
            until: until?.toISOString(),
            access_token: auth.accessToken,
          },
        },
      );

      const metrics = this.processInsightsMetrics(response.data.data);

      // Store insights in MongoDB
      await this.threadsInsightsModel.create({
        userId,
        metrics,
        since,
        until,
      });

      return metrics;
    } catch (error) {
      this.logger.error(`Error fetching user insights: ${error.message}`);
      throw error;
    }
  }

  private processInsightsMetrics(metrics: any[]) {
    const processed = {};
    metrics.forEach((metric, index) => {
      if (metric.name === 'views') {
        processed[metric.name] = metric.values?.[0]?.value;
      } else {
        processed[metric.name] = metric.total_value?.value;
      }
    });
    return processed;
  }
}
