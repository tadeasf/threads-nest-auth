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
  @ApiOperation({ summary: 'Handle OAuth callback from Threads' })
  @ApiResponse({ status: 302, description: 'Redirect after successful authentication' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req,
    @Res() res: Response
  ) {
    try {
      const data = await this.authService.exchangeAuthorizationCode(code);

      // Store in MongoDB
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

      // Set session data
      req.session.access_token = data.access_token;
      req.session.user_id = data.user_id;

      // Fix: Use absolute URL for redirect
      const frontendUrl = this.configService.get('FRONTEND_URL');
      if (!frontendUrl) {
        throw new Error('FRONTEND_URL environment variable is not set');
      }
      
      res.redirect(`${frontendUrl}/auth/account`);
    } catch (error) {
      console.error('Token exchange error:', error);
      const frontendUrl = this.configService.get('FRONTEND_URL');
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }
}
