import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Session,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadsAuth } from './schemas/threads-auth.schema';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './guards/auth.guard';
import { HttpService } from '@nestjs/axios';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @InjectModel(ThreadsAuth.name)
    private threadsAuthModel: Model<ThreadsAuth>,
    private readonly httpService: HttpService,
  ) {}

  @Get('auth/account')
  @UseGuards(AuthGuard)
  async getAccount(@Session() session: any) {
    if (!session.access_token || !session.user_id) {
      throw new UnauthorizedException();
    }

    try {
      const response = await this.httpService.get(
        'https://graph.threads.net/v1/me',
        {
          params: {
            fields: 'id,username,threads_profile_picture_url',
            access_token: session.access_token
          }
        }
      ).toPromise();

      return {
        userId: session.user_id,
        username: response.data.username,
        profilePicture: response.data.threads_profile_picture_url
      };
    } catch (error) {
      console.error('Account fetch error:', error);
      throw new HttpException('Failed to fetch account data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('callback')
  @Post('callback')
  @ApiOperation({ summary: 'Handle OAuth callback from Threads' })
  @ApiResponse({ status: 302, description: 'Redirect after successful authentication' })
  async handleCallback(
    @Query('code') queryCode: string,
    @Query('state') queryState: string,
    @Body() body: { code?: string; state?: string },
    @Res() res: Response,
    @Session() session: any
  ) {
    try {
      const code = queryCode || body.code;
      const state = queryState || body.state;

      if (!code || !state) {
        throw new Error('Missing code or state');
      }

      const data = await this.authService.handleCallback(code, state);
      
      // Set session data
      session.authenticated = true;
      session.access_token = data.accessToken;
      session.user_id = data.userId;
      
      // Set cookie and redirect to frontend
      res.cookie('auth_token', data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      // Redirect to frontend with success
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/?auth=success`
      );
    } catch (error) {
      console.error('Callback error:', error);
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/?error=auth_failed`
      );
    }
  }

  @Get('logout')
  @ApiOperation({ summary: 'Logout and destroy session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Session() session: any, @Res() res: Response) {
    if (session) {
      session.destroy((err) => {
        if (err) {
          return res.redirect(`${this.configService.get('FRONTEND_URL')}/auth/error`);
        }
        res.redirect(this.configService.get('FRONTEND_URL'));
      });
    } else {
      res.redirect(this.configService.get('FRONTEND_URL'));
    }
  }

  @Get('login')
  @ApiOperation({ summary: 'Get Threads authorization URL' })
  async getAuthorizationUrl() {
    console.log("NestJS: Login endpoint hit");
    try {
      const url = this.authService.buildAuthorizationUrl();
      console.log("NestJS: Generated URL:", url);
      return { url };
    } catch (error) {
      console.error("NestJS: Error generating URL:", error);
      throw error;
    }
  }
}
