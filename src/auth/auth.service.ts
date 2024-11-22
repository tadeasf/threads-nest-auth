import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

  constructor(private configService: ConfigService) {
    const version = this.configService.get('GRAPH_API_VERSION');
    this.GRAPH_API_BASE_URL = `https://graph.threads.net/${version}/`;
  }

  buildAuthorizationUrl() {
    return this.buildGraphAPIURL('oauth/authorize', {
      scope: this.SCOPES.join(','),
      client_id: this.configService.get('THREADS_APP_ID'),
      redirect_uri: this.configService.get('REDIRECT_URI'),
      response_type: 'code',
    }, null, this.AUTHORIZATION_BASE_URL);
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
}
