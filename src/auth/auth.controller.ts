import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token/exchange')
  @ApiOperation({ summary: 'Exchange Instagram auth code for access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        shortLivedToken: {
          type: 'string',
          description: 'Short-lived Instagram access token',
        },
      },
      required: ['shortLivedToken'],
    },
    examples: {
      example: {
        value: { shortLivedToken: 'IGQWRPcG...' },
        description: 'Example of a short-lived Instagram token',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token exchange successful',
    schema: { $ref: '#/components/examples/TokenExchangeResponse/value' },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    schema: { $ref: '#/components/examples/ErrorBadRequest/value' },
  })
  async exchangeToken(@Body('shortLivedToken') token: string) {
    const longLivedToken =
      await this.authService.exchangeShortLivedToken(token);
    return { token: longLivedToken };
  }

  @Get('token')
  async getToken() {
    const token = await this.authService.getLongLivedToken();
    return { token };
  }
}
