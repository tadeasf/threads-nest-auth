import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly GRAPH_API_BASE_URL = 'https://graph.threads.net';
  private readonly AUTHORIZATION_BASE_URL = 'https://www.threads.net';
  private readonly GRAPH_API_VERSION: string;

  constructor(private configService: ConfigService) {
    this.GRAPH_API_VERSION = this.configService.get('GRAPH_API_VERSION');
  }

  async exchangeAuthorizationCode(code: string) {
    const tokenEndpoint = `${this.AUTHORIZATION_BASE_URL}/oauth/access_token`;
    
    const formData = new URLSearchParams({
      client_id: this.configService.get('THREADS_APP_ID'),
      client_secret: this.configService.get('THREADS_APP_SECRET'),
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.configService.get('REDIRECT_URI')
    });

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange error:', {
          status: response.status,
          body: errorText
        });
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Get long-lived token
      const longLivedToken = await this.getLongLivedToken(data.access_token);
      
      return {
        access_token: longLivedToken,
        user_id: data.user_id
      };
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  }

  private async getLongLivedToken(shortLivedToken: string) {
    const url = this.buildGraphAPIURL('oauth/access_token', {
      grant_type: 'ig_exchange_token',
      client_secret: this.configService.get('THREADS_APP_SECRET'),
      access_token: shortLivedToken
    });

    const response = await fetch(url);
    const data = await response.json();
    return data.access_token;
  }

  private buildGraphAPIURL(path: string, params: Record<string, string>) {
    const url = new URL(`${this.GRAPH_API_BASE_URL}/${this.GRAPH_API_VERSION}/${path}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  }
}
