import { Module, MiddlewareConsumer, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ThreadsModule } from './threads/threads.module';
import { HealthController } from './health/health.controller';
import { AuthController } from './auth/auth.controller';
import { ThreadsAuth, ThreadsAuthSchema } from './auth/schemas/threads-auth.schema';
import * as session from 'express-session';
import { createClient } from '@redis/client';
import RedisStore from 'connect-redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
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
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          url: configService.get('REDIS_URL'),
        });
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
    {
      provide: 'SESSION_STORE',
      useFactory: (redisClient: ReturnType<typeof createClient>) => {
        return new RedisStore({
          client: redisClient,
          prefix: 'threads-session:',
        });
      },
      inject: ['REDIS_CLIENT'],
    },
  ],
})
export class AppModule {
  constructor(
    private configService: ConfigService,
    @Inject('SESSION_STORE') private readonly sessionStore: RedisStore
  ) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        session({
          store: this.sessionStore,
          secret: this.configService.get('SESSION_SECRET'),
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: this.configService.get('NODE_ENV') === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: this.configService.get('NODE_ENV') === 'production' ? 'none' : 'lax',
          },
        }),
      )
      .forRoutes('*');
  }
}
