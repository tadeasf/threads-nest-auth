import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly GRAPH_API_VERSION = 'v1';
  private readonly AUTHORIZATION_BASE_URL = 'https://www.threads.net';
  private readonly GRAPH_API_BASE_URL = 'https://graph.threads.net';

  constructor(private configService: ConfigService) {}

  async exchangeAuthorizationCode(code: string) {
    const tokenEndpoint = `${this.AUTHORIZATION_BASE_URL}/oauth/access_token`;
    
    const formData = new URLSearchParams();
    formData.append('client_id', this.configService.get('THREADS_APP_ID'));
    formData.append('client_secret', this.configService.get('THREADS_APP_SECRET'));
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append('redirect_uri', this.configService.get('REDIRECT_URI'));

    try {
      console.log('Token exchange request:', {
        endpoint: tokenEndpoint,
        clientId: this.configService.get('THREADS_APP_ID'),
        redirectUri: this.configService.get('REDIRECT_URI')
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      return {
        access_token: data.access_token,
        user_id: data.user_id
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  buildGraphAPIURL(endpoint: string, params: Record<string, any>, accessToken: string) {
    const url = new URL(`${this.GRAPH_API_BASE_URL}/${this.GRAPH_API_VERSION}/${endpoint}`);
    url.searchParams.append('access_token', accessToken);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }
    
    return url.toString();
  }
}
