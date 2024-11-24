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
    @Session() session: any,
    @Res() res: Response
  ) {
    if (error) {
      return res.redirect(`${this.configService.get('FRONTEND_URL')}/?error=auth_failed`);
    }

    try {
      const authData = await this.authService.handleCallback(code);
      
      // Set session data
      session.user_id = authData.userId;
      session.access_token = authData.accessToken;
      
      return res.redirect(`${this.configService.get('FRONTEND_URL')}/?success=auth`);
    } catch (error) {
      console.error('Callback error:', error);
      return res.redirect(`${this.configService.get('FRONTEND_URL')}/?error=auth_failed`);
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
  async getCurrentUser(@Session() session: any) {
    try {
      if (!session.user_id) {
        return { user: null };
      }

      const userAuth = await this.threadsAuthModel.findOne({ 
        userId: session.user_id 
      });

      if (!userAuth) {
        return { user: null };
      }

      return {
        user: {
          id: userAuth.userId,
          username: userAuth.username,
          profilePicture: userAuth.profilePicture
        }
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null };
    }
  }
}
