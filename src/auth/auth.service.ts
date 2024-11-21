import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from '../threads/graphql.client';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private graphqlClient: GraphQLClient,
  ) {}

  private shortLivedToken: string | null = null;
  private longLivedToken: string | null = null;

  async exchangeShortLivedToken(token: string): Promise<string> {
    // Store short-lived token
    this.shortLivedToken = token;

    // TODO: Implement Meta Graph API token exchange
    // https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived

    // For now, returning a mock response
    this.longLivedToken = 'mock_long_lived_token';
    return this.longLivedToken;
  }

  async getLongLivedToken(): Promise<string | null> {
    return this.longLivedToken;
  }

  buildAuthorizationUrl(): string {
    const params = new URLSearchParams({
      scope: ['threads_basic', 'threads_content_publish'].join(','),
      client_id: this.configService.get('THREADS_APP_ID'),
      redirect_uri: this.configService.get('THREADS_REDIRECT_URI'),
      response_type: 'code',
    });

    return `https://www.threads.net/oauth/authorize?${params.toString()}`;
  }

  async getUserDetails(accessToken: string) {
    const fields = ['username', 'threads_profile_picture_url', 'threads_biography'].join(',');
    const query = `
      query UserProfile {
        me {
          ${fields}
        }
      }
    `;

    const response = await this.graphqlClient.makeRequest(
      query,
      {}, // variables
      accessToken
    );

    const userDetails = response.data.me;
    userDetails.user_profile_url = `https://www.threads.net/@${userDetails.username}`;
    
    return userDetails;
  }

  async exchangeAuthorizationCode(code: string) {
    const response = await fetch(
      'https://graph.threads.net/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.configService.get('THREADS_APP_ID'),
          client_secret: this.configService.get('THREADS_APP_SECRET'),
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.configService.get('THREADS_REDIRECT_URI'),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      user_id: data.user_id,
    };
  }
}
