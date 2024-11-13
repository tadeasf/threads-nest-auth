import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Redirect,
  Injectable,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadsAuth } from './schemas/threads-auth.schema';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token/exchange')
  @ApiOperation({
    summary: 'Exchange Instagram auth code for access token',
    description: `
      Exchange your Instagram OAuth code for a Threads access token.
      You need to first authenticate with Instagram and get the code from the redirect URL.
      
      Example OAuth URL:
      https://api.instagram.com/oauth/authorize
        ?client_id=${process.env.THREADS_APP_ID}
        &redirect_uri=${process.env.THREADS_REDIRECT_CALLBACK_URL}
        &scope=threads_api
        &response_type=code
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Instagram OAuth code from redirect URL',
          example: 'AQD8h7qtQyJ...',
        },
      },
      required: ['code'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token exchange successful',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'IGQWRPcG...',
        },
        token_type: {
          type: 'string',
          example: 'Bearer',
        },
        expires_in: {
          type: 'number',
          example: 3600,
        },
      },
    },
  })
  async exchangeToken(@Body('code') code: string) {
    const token = await this.authService.exchangeShortLivedToken(code);
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }

  @Get('token')
  @ApiOperation({
    summary: 'Get current access token',
    description: 'Returns the currently stored access token if available',
  })
  @ApiResponse({
    status: 200,
    description: 'Token retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'IGQWRPcG...',
        },
        valid: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  async getToken() {
    const token = await this.authService.getLongLivedToken();
    return { token, valid: !!token };
  }
}

@ApiTags('auth')
@Controller('threads')
@Injectable()
export class ThreadsCallbackController {
  constructor(
    @InjectModel(ThreadsAuth.name)
    private threadsAuthModel: Model<ThreadsAuth>,
  ) {}

  @Get('callback')
  @ApiOperation({ summary: 'Handle OAuth callback from Threads' })
  @ApiResponse({ status: 200, description: 'Token stored successfully' })
  async handleCallback(@Query('code') code: string) {
    try {
      const response = await fetch(
        'https://graph.threads.net/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.THREADS_APP_ID,
            client_secret: process.env.THREADS_APP_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.THREADS_REDIRECT_CALLBACK_URL,
          }),
        },
      );

      const data = await response.json();

      // Store in MongoDB
      const auth = new this.threadsAuthModel({
        userId: data.user_id,
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        isActive: true,
      });

      await auth.save();

      return {
        message: 'Authentication successful',
        userId: data.user_id,
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }
}
