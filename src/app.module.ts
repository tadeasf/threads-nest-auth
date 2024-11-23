import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ThreadsModule } from './threads/threads.module';
import { HealthController } from './health/health.controller';
import { AuthController } from './auth/auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import {
  ThreadsAuth,
  ThreadsAuthSchema,
} from './auth/schemas/threads-auth.schema';
import * as session from 'express-session';
import { createClient } from '@redis/client';
import * as connectRedis from 'connect-redis';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    DatabaseModule,
    AuthModule,
    ThreadsModule,
    MongooseModule.forFeature([
      { name: ThreadsAuth.name, schema: ThreadsAuthSchema },
    ]),
  ],
  controllers: [HealthController, AuthController],
  providers: [
    {
      provide: 'SESSION_STORE',
      useFactory: async () => {
        const RedisStore = connectRedis(session);
        const redisClient = createClient({
          url: process.env.REDIS_URL,
        });
        await redisClient.connect();
        return new RedisStore({ client: redisClient });
      },
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        session({
          secret: process.env.SESSION_SECRET,
          resave: false,
          saveUninitialized: false,
          cookie: { 
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
          },
        }),
      )
      .forRoutes('*');
  }
}
