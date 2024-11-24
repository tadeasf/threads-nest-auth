import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadsAuth } from './schemas/threads-auth.schema';

@Injectable()
export class AuthService {
  private readonly THREADS_API_BASE = 'https://www.threads.net';
  private readonly GRAPH_API_BASE = 'https://graph.threads.net';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectModel(ThreadsAuth.name) private threadsAuthModel: Model<ThreadsAuth>
  ) {}

  async handleCallback(code: string) {
    try {
      // Step 1: Exchange code for access token
      const tokenResponse = await this.httpService.post(
        `${this.THREADS_API_BASE}/oauth/access_token`,
        null,
        {
          params: {
            client_id: this.configService.get('THREADS_APP_ID'),
            client_secret: this.configService.get('THREADS_APP_SECRET'),
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${this.configService.get('API_URL')}/auth/callback`
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      ).toPromise();

      console.log('Token Response:', tokenResponse.data);
      const { access_token, user_id } = tokenResponse.data;

      // Step 2: Get user profile
      const userResponse = await this.httpService.get(
        `${this.GRAPH_API_BASE}/me`,
        {
          params: {
            fields: 'id,username,threads_profile_picture_url',
            access_token
          },
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      ).toPromise();

      console.log('User Response:', userResponse.data);
      const { username, threads_profile_picture_url } = userResponse.data;

      // Step 3: Store in MongoDB
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60); // 60 days from now

      const userAuth = await this.threadsAuthModel.findOneAndUpdate(
        { userId: user_id },
        {
          userId: user_id,
          username,
          profilePicture: threads_profile_picture_url,
          accessToken: access_token,
          lastUpdated: new Date(),
          tokenExpiresAt: expiresAt
        },
        { upsert: true, new: true }
      );

      console.log('Stored user auth:', userAuth);

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
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  buildAuthorizationUrl() {
    const state = Date.now().toString();
    const scopes = [
      'threads_basic',
      'threads_content_publish',
      'threads_manage_insights',
      'threads_manage_replies',
      'threads_read_replies'
    ].join(' ');

    const url = new URL(`${this.THREADS_API_BASE}/oauth/authorize`);
    url.searchParams.append('client_id', this.configService.get('THREADS_APP_ID'));
    url.searchParams.append('redirect_uri', `${this.configService.get('API_URL')}/auth/callback`);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', scopes);
    url.searchParams.append('state', state);

    return url.toString();
  }
}
