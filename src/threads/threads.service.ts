import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ThreadsClient } from './threads.client';

@Injectable()
export class ThreadsService {
  private threadsClient: ThreadsClient;

  constructor() {
    this.threadsClient = new ThreadsClient();
  }

  async login(credentials: { username: string; password: string }) {
    try {
      const session = await this.threadsClient.login(
        credentials.username,
        credentials.password,
      );

      return {
        success: true,
        session_id: session.id,
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async createPost(token: string, content: string, imageUrl?: string) {
    // Implementation for creating posts
  }

  async getUserProfile(username: string) {
    // Implementation for getting user profile
  }
}
