import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

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