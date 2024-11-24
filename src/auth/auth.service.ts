import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadsAuth } from './schemas/threads-auth.schema';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AuthService {
  private readonly GRAPH_API_BASE_URL: string;
  private readonly AUTHORIZATION_BASE_URL = 'https://www.threads.net';
  private readonly SCOPES = [
    'threads_basic',
    'threads_content_publish',
    'threads_manage_insights',
    'threads_manage_replies',
    'threads_read_replies'
  ];

  constructor(
    private configService: ConfigService,
    @InjectModel(ThreadsAuth.name) private threadsAuthModel: Model<ThreadsAuth>,
    private readonly httpService: HttpService,
  ) {
    const version = this.configService.get('GRAPH_API_VERSION');
    this.GRAPH_API_BASE_URL = `https://graph.threads.net/${version}/`;
  }

  buildAuthorizationUrl() {
    const params = new URLSearchParams({
      client_id: this.configService.get('THREADS_APP_ID'),
      redirect_uri: `${this.configService.get('API_URL')}/auth/callback`,
      response_type: 'code',
      scope: this.SCOPES.join(','),
      state: Date.now().toString()
    });

    return `${this.AUTHORIZATION_BASE_URL}/oauth/authorize?${params.toString()}`;
  }

  async exchangeAuthorizationCode(code: string) {
    const tokenUrl = this.buildGraphAPIURL('oauth/access_token', {}, null, this.GRAPH_API_BASE_URL);

    try {
      const formData = new URLSearchParams({
        client_id: this.configService.get('THREADS_APP_ID'),
        client_secret: this.configService.get('THREADS_APP_SECRET'),
        grant_type: 'authorization_code',
        redirect_uri: this.configService.get('REDIRECT_URI'),
        code: code,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        access_token: data.access_token,
        user_id: data.user_id
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  private buildGraphAPIURL(path: string, params: Record<string, string>, accessToken?: string, baseUrl?: string) {
    const url = new URL(path, baseUrl ?? this.GRAPH_API_BASE_URL);
    url.search = new URLSearchParams(params).toString();
    if (accessToken) {
      url.searchParams.append('access_token', accessToken);
    }
    return url.toString();
  }

  async handleCallback(code: string, state: string) {
    try {
      const { access_token, user_id } = await this.exchangeAuthorizationCode(code);

      const userProfile = await this.fetchUserProfile(access_token);

      const authData = await this.threadsAuthModel.findOneAndUpdate(
        { userId: user_id },
        {
          userId: user_id,
          accessToken: access_token,
          username: userProfile.username,
          threadsProfilePictureUrl: userProfile.profile_picture_url,
          isActive: true,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        { upsert: true, new: true }
      );

      return {
        userId: user_id,
        accessToken: access_token,
        username: userProfile.username,
        profilePicture: userProfile.profile_picture_url
      };
    } catch (error) {
      console.error('Handle callback error:', error);
      throw new UnauthorizedException('Failed to authenticate with Threads');
    }
  }

  private async fetchUserProfile(accessToken: string) {
    try {
      const response = await this.httpService.get(
        'https://graph.threads.net/v1/me',
        {
          params: {
            fields: 'id,username,threads_profile_picture_url',
            access_token: accessToken
          }
        }
      ).toPromise();

      return {
        username: response.data.username,
        profile_picture_url: response.data.threads_profile_picture_url
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }
}
