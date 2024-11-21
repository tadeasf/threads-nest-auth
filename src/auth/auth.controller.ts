import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Redirect,
  Injectable,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadsAuth } from './schemas/threads-auth.schema';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './guards/auth.guard';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @InjectModel(ThreadsAuth.name)
    private threadsAuthModel: Model<ThreadsAuth>,
  ) {}

  @Post('token/exchange')
  @ApiOperation({
    summary: 'Exchange Threads auth code for access token',
    description: `
      Exchange your Threads OAuth code for a Threads access token.
      You need to first authenticate with Threads and get the code from the redirect URL.
      
      Example OAuth URL:
      https://threads.net/oauth/authorize
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
          description: 'OAuth code from redirect URL',
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

  @Get('login')
  @ApiOperation({ summary: 'Initiate Threads OAuth login flow' })
  @ApiResponse({ status: 302, description: 'Redirect to Threads authorization page' })
  async login(@Res() res: Response, @Req() req) {
    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(7);
    req.session.oauthState = state;

    const authUrl = new URL('https://threads.net/oauth/authorize');
    authUrl.searchParams.append('client_id', this.configService.get('THREADS_APP_ID'));
    authUrl.searchParams.append('redirect_uri', this.configService.get('THREADS_REDIRECT_CALLBACK_URL'));
    authUrl.searchParams.append('scope', 'threads_api');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', state);

    res.redirect(authUrl.toString());
  }

  @Get('account')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current user account details' })
  async getAccount(@Req() req) {
    return this.authService.getUserDetails(req.session.access_token);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle OAuth callback from Threads' })
  @ApiResponse({ status: 200, description: 'Token stored successfully' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req,
    @Res() res: Response
  ) {
    // Verify state parameter to prevent CSRF attacks
    if (state !== req.session.oauthState) {
      throw new UnauthorizedException('Invalid state parameter');
    }

    try {
      const tokenData = await this.authService.exchangeAuthorizationCode(code);

      // Use findOneAndUpdate instead of creating new document
      await this.threadsAuthModel.findOneAndUpdate(
        { userId: tokenData.user_id },
        {
          $set: {
            userId: tokenData.user_id,
            accessToken: tokenData.access_token,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
            isActive: true,
          }
        },
        { upsert: true, new: true }
      );

      // Set session
      req.session.access_token = tokenData.access_token;
      req.session.user_id = tokenData.user_id;

      res.redirect('/auth/account');
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
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

      // Use findOneAndUpdate instead of creating new document
      await this.threadsAuthModel.findOneAndUpdate(
        { userId: data.user_id },
        {
          $set: {
            userId: data.user_id,
            accessToken: data.access_token,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            isActive: true,
          }
        },
        { upsert: true, new: true }
      );

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
