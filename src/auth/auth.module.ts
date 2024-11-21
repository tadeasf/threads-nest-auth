import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard } from './guards/auth.guard';
import { GraphQLClient } from '../threads/graphql.client';
import { MongooseModule } from '@nestjs/mongoose';
import { ThreadsAuth, ThreadsAuthSchema } from './schemas/threads-auth.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ThreadsAuth.name, schema: ThreadsAuthSchema },
    ]),
  ],
  providers: [AuthService, AuthGuard, GraphQLClient],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
