import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GraphQLClient {
  private apiUrl = 'https://www.threads.net/api/graphql';
  private deviceId: string;
  private appId: string;

  constructor(private configService: ConfigService) {
    this.deviceId = this.configService.get('THREADS_DEVICE_ID');
    this.appId = this.configService.get('THREADS_APP_ID');
  }

  private async makeRequest(query: string, variables: any, token?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-IG-App-ID': this.appId,
      'X-Device-ID': this.deviceId,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async createPost(token: string, content: string) {
    const query = `
      mutation createPost($input: CreatePostInput!) {
        createPost(input: $input) {
          post {
            id
            text
            createdAt
          }
        }
      }
    `;

    return this.makeRequest(
      query,
      {
        input: {
          text: content,
        },
      },
      token,
    );
  }

  async getProfile(username: string) {
    const query = `
      query UserProfile($username: String!) {
        user(username: $username) {
          id
          username
          fullName
          biography
          followersCount
          followingCount
        }
      }
    `;

    return this.makeRequest(query, { username });
  }
}
