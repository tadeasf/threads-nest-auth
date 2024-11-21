import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard } from './guards/auth.guard';
import { GraphQLClient } from '../threads/graphql.client';

@Module({
  imports: [ConfigModule],
  providers: [AuthService, AuthGuard, GraphQLClient],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
