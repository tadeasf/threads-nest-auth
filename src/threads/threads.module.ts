import { Module } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { ThreadsController } from './threads.controller';
import { GraphQLClient } from './graphql.client';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [ThreadsService, GraphQLClient],
  controllers: [ThreadsController],
})
export class ThreadsModule {}
