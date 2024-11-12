import { Controller, Post, Body, Get, Param, Headers } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('threads')
@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login to Threads',
    description: 'Authenticate with Threads using Instagram credentials',
  })
  @ApiBody({
    schema: { $ref: '#/components/schemas/ThreadsLoginRequest' },
    examples: {
      loginExample: {
        summary: 'Basic Login Request',
        value: {
          username: 'your_username',
          password: 'your_password',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: { $ref: '#/components/schemas/ThreadsLoginResponse' },
    content: {
      'application/json': {
        example: {
          success: true,
          session_id: 'session_xyz_123',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    content: {
      'application/json': {
        example: {
          message: 'Invalid credentials',
          error: 'Unauthorized',
          statusCode: 401,
        },
      },
    },
  })
  async login(@Body() credentials: { username: string; password: string }) {
    console.log('Login attempt for username:', credentials.username);
    try {
      const result = await this.threadsService.login(credentials);
      console.log('Login result:', result);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  @Post('posts')
  async createPost(
    @Headers('authorization') auth: string,
    @Body() { content, imageUrl }: { content: string; imageUrl?: string },
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.threadsService.createPost(token, content, imageUrl);
  }

  @Get('profile/:username')
  async getUserProfile(@Param('username') username: string) {
    return this.threadsService.getUserProfile(username);
  }
}
