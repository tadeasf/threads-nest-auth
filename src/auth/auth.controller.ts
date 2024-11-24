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
    if (!session.user_id) {
      throw new UnauthorizedException();
    }

    try {
      const userAuth = await this.threadsAuthModel.findOne({ 
        userId: session.user_id 
      });

      if (!userAuth) {
        throw new UnauthorizedException();
      }

      return {
        userId: userAuth.userId,
        username: userAuth.username,
        profilePicture: userAuth.profilePicture
      };
    } catch (error) {
      console.error('Account fetch error:', error);
      throw new HttpException('Failed to fetch account data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Query('error_reason') errorReason: string,
    @Query('error_description') errorDescription: string,
    @Session() session: any,
    @Res() res: Response
  ) {
    if (error) {
      console.error('OAuth error:', { error, errorReason, errorDescription });
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/?error=auth_failed&reason=${errorReason}`
      );
    }

    try {
      console.log('Received code:', code);
      const authData = await this.authService.handleCallback(code);
      
      // Set session data
      session.user_id = authData.userId;
      session.access_token = authData.accessToken;
      
      // Set secure cookie
      res.cookie('auth_token', authData.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 24 * 60 * 60 * 1000 // 60 days
      });

      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/?success=auth`
      );
    } catch (error) {
      console.error('Callback error:', error);
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/?error=auth_failed`
      );
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and destroy session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Session() session: any, @Res() res: Response) {
    try {
      if (session) {
        await new Promise((resolve, reject) => {
          session.destroy((err) => {
            if (err) reject(err);
            else resolve(true);
          });
        });
      }
      
      res.clearCookie('auth_token');
      return res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      throw new HttpException('Logout failed', HttpStatus.INTERNAL_SERVER_ERROR);
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

  @Get('me')
  async getCurrentUser(@Session() session: any, @Req() req: Request) {
    try {
      if (!session.user_id) {
        throw new UnauthorizedException();
      }

      const userAuth = await this.threadsAuthModel.findOne({ 
        userId: session.user_id 
      });

      if (!userAuth) {
        throw new UnauthorizedException();
      }

      // Check if token needs refresh (if older than 24 hours)
      const tokenAge = Date.now() - userAuth.lastUpdated.getTime();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      if (tokenAge > oneDayInMs) {
        try {
          const newToken = await this.authService.refreshToken(userAuth.accessToken);
          userAuth.accessToken = newToken;
          userAuth.lastUpdated = new Date();
          await userAuth.save();
        } catch (error) {
          console.error('Token refresh error:', error);
          throw new UnauthorizedException('Token refresh failed');
        }
      }

      return {
        user: {
          id: userAuth.userId,
          username: userAuth.username,
          profilePicture: userAuth.profilePicture
        }
      };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
