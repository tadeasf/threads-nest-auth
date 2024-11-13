import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('threads')
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get user profile data' })
  @ApiResponse({
    status: 200,
    description: 'Profile data retrieved successfully',
  })
  async getProfile(@Param('userId') userId: number) {
    return this.threadsService.getUserProfile(userId);
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a new thread post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  async createPost(
    @Param('userId') userId: number,
    @Body()
    createPostDto: {
      text?: string;
      mediaUrl?: string;
      mediaType?: 'IMAGE' | 'VIDEO';
      altText?: string;
      linkAttachment?: string;
      replyControl?: 'FOLLOWING' | 'MENTIONED' | 'EVERYONE';
    },
  ) {
    return this.threadsService.createPost(userId, createPostDto);
  }

  @Get(':userId/posts')
  @ApiOperation({ summary: 'Get user posts' })
  async getUserPosts(
    @Param('userId') userId: number,
    @Query('limit') limit?: number,
  ) {
    return this.threadsService.getUserPosts(userId, limit);
  }

  @Get(':userId/posts/:threadId/replies')
  @ApiOperation({ summary: 'Get post replies' })
  async getPostReplies(
    @Param('userId') userId: number,
    @Param('threadId') threadId: string,
    @Query('limit') limit?: number,
  ) {
    return this.threadsService.getPostReplies(userId, threadId, limit);
  }

  @Get(':userId/insights')
  @ApiOperation({ summary: 'Get user insights' })
  async getUserInsights(
    @Param('userId') userId: number,
    @Query('since') since?: Date,
    @Query('until') until?: Date,
  ) {
    return this.threadsService.getUserInsights(userId, since, until);
  }
}
