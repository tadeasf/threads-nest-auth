import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadsAuth } from '../auth/schemas/threads-auth.schema';
import axios from 'axios';

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name);
  private readonly graphApiBaseUrl = 'https://graph.threads.net/v1';

  constructor(
    @InjectModel(ThreadsAuth.name)
    private threadsAuthModel: Model<ThreadsAuth>,
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
}
