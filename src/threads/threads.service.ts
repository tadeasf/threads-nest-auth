import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { GraphQLClient } from './graphql.client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name);

  constructor(
    private graphqlClient: GraphQLClient,
    private configService: ConfigService,
  ) {}

  async createPost(token: string, content: string) {
    try {
      const result = await this.graphqlClient.createPost(token, content);
      return {
        success: true,
        post_id: result.data.createPost.post.id,
        text: result.data.createPost.post.text,
        created_at: result.data.createPost.post.createdAt,
      };
    } catch (error: unknown) {
      this.logger.error('Failed to create post', error);
      throw new UnauthorizedException('Failed to create post');
    }
  }

  async getUserProfile(username: string) {
    try {
      const result = await this.graphqlClient.getProfile(username);
      return {
        username: result.data.user.username,
        full_name: result.data.user.fullName,
        follower_count: result.data.user.followersCount,
        following_count: result.data.user.followingCount,
        bio: result.data.user.biography,
      };
    } catch (error: unknown) {
      this.logger.error('Failed to fetch profile', error);
      throw new UnauthorizedException('Failed to fetch profile');
    }
  }
}
