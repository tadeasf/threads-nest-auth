import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
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
}
