import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
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
}
