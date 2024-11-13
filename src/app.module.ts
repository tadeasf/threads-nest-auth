import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ThreadsModule } from './threads/threads.module';
import { HealthController } from './health/health.controller';
import { ThreadsCallbackController } from './auth/auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ThreadsAuth,
  ThreadsAuthSchema,
} from './auth/schemas/threads-auth.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    ThreadsModule,
    MongooseModule.forFeature([
      { name: ThreadsAuth.name, schema: ThreadsAuthSchema },
    ]),
  ],
  controllers: [HealthController, ThreadsCallbackController],
})
export class AppModule {}
