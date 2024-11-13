import { Module } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { ThreadsController } from './threads.controller';
import { GraphQLClient } from './graphql.client';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ThreadsAuth,
  ThreadsAuthSchema,
} from '../auth/schemas/threads-auth.schema';
import {
  ThreadsInsights,
  ThreadsInsightsSchema,
} from './schemas/threads-insights.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: 'ThreadsAuth', schema: ThreadsAuthSchema },
      { name: 'ThreadsInsights', schema: ThreadsInsightsSchema },
    ]),
  ],
  providers: [ThreadsService, GraphQLClient],
  controllers: [ThreadsController],
  exports: [ThreadsService],
})
export class ThreadsModule {}
