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
      
      // Store in session
      req.session.access_token = data.access_token;
      req.session.user_id = data.user_id;
      
      const frontendUrl = this.configService.get('FRONTEND_URL');
      if (!frontendUrl) {
        throw new Error('FRONTEND_URL not configured');
      }
      
      return res.redirect(`${frontendUrl}/api/account`);
    } catch (error) {
      console.error('Auth callback error:', error);
      const frontendUrl = this.configService.get('FRONTEND_URL');
      if (!frontendUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
      }
      return res.redirect(`${frontendUrl}/auth/error`);
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
