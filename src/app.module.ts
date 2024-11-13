import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ThreadsModule } from './threads/threads.module';
import { HealthController } from './health/health.controller';
import { ThreadsCallbackController } from './auth/auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    ThreadsModule,
  ],
  controllers: [HealthController, ThreadsCallbackController],
})
export class AppModule {}
