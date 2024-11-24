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

  @Post('callback')
  async handleCallback(
    @Body() body: { code: string; state: string },
    @Session() session: Record<string, any>,
    @Res() res: Response
  ) {
    try {
      const authResult = await this.authService.handleCallback(body.code);
      
      // Set session data
      session.user_id = authResult.userId;
      session.authenticated = true;
      
      // Store auth data in MongoDB
      await this.threadsAuthModel.findOneAndUpdate(
        { userId: authResult.userId },
        {
          userId: authResult.userId,
          username: authResult.user.username,
          profilePicture: authResult.user.profilePicture,
          accessToken: authResult.accessToken,
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        },
        { upsert: true }
      );

      return res.json({
        success: true,
        user: authResult.user
      });
    } catch (error) {
      console.error('Auth callback error:', error);
      throw new UnauthorizedException('Authentication failed');
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
