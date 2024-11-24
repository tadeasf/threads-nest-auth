import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadsAuth } from './schemas/threads-auth.schema';

@Injectable()
export class AuthService {
  private readonly THREADS_APP_ID: string;
  private readonly THREADS_APP_SECRET: string;
  private readonly REDIRECT_URI: string;
  private readonly GRAPH_API_BASE_URL = 'https://graph.threads.net/v1/';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectModel(ThreadsAuth.name) private threadsAuthModel: Model<ThreadsAuth>
  ) {
    this.THREADS_APP_ID = this.configService.get<string>('THREADS_APP_ID');
    this.THREADS_APP_SECRET = this.configService.get<string>('THREADS_APP_SECRET');
    this.REDIRECT_URI = `${this.configService.get<string>('API_URL')}/auth/callback`;
  }

  buildAuthorizationUrl() {
    const state = Date.now().toString();
    const scopes = [
      'threads_basic',
      'threads_content_publish',
      'threads_manage_insights',
      'threads_manage_replies',
      'threads_read_replies'
    ].join(',');

    const url = new URL('https://www.threads.net/oauth/authorize');
    url.searchParams.append('client_id', this.THREADS_APP_ID);
    url.searchParams.append('redirect_uri', this.REDIRECT_URI);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', scopes);
    url.searchParams.append('state', state);

    return url.toString();
  }

  async handleCallback(code: string) {
    try {
      // Exchange code for tokens
      const tokenResponse = await this.httpService.post(
        'https://graph.threads.net/oauth/access_token',
        null,
        {
          params: {
            client_id: this.THREADS_APP_ID,
            client_secret: this.THREADS_APP_SECRET,
            code,
            redirect_uri: this.REDIRECT_URI,
            grant_type: 'authorization_code'
          }
        }
      ).toPromise();

      const { access_token, user_id } = tokenResponse.data;

      // Get user profile
      const userResponse = await this.httpService.get(
        `${this.GRAPH_API_BASE_URL}me`,
        {
          params: {
            fields: 'id,username,threads_profile_picture_url',
            access_token
          }
        }
      ).toPromise();

      const { username, threads_profile_picture_url } = userResponse.data;

      // Store in MongoDB
      await this.threadsAuthModel.findOneAndUpdate(
        { userId: user_id },
        {
          userId: user_id,
          username,
          profilePicture: threads_profile_picture_url,
          accessToken: access_token,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      return {
        user: {
          id: user_id,
          username,
          profilePicture: threads_profile_picture_url
        },
        accessToken: access_token,
        userId: user_id
      };
    } catch (error) {
      console.error('Auth callback error:', error.response?.data || error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async getUserProfile(accessToken: string) {
    try {
      const response = await this.httpService.get(
        `${this.GRAPH_API_BASE_URL}me`,
        {
          params: {
            fields: 'id,username,threads_profile_picture_url',
            access_token: accessToken
          }
        }
      ).toPromise();

      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error.response?.data || error);
      throw new UnauthorizedException('Failed to fetch user profile');
    }
  }
}
