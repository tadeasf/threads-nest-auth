import { Controller, Post, Body, Get, Param, Headers } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('threads')
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post('posts')
  @ApiOperation({ summary: 'Create a new thread post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @Headers('authorization') auth: string,
    @Body() { content }: { content: string },
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.threadsService.createPost(token, content);
  }

  @Get('profile/:username')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProfile(@Param('username') username: string) {
    return this.threadsService.getUserProfile(username);
  }
}
