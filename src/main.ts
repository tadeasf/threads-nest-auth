import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import chalk from 'chalk';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // OpenAPI/Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Threads Bot API')
    .setDescription('API for managing Threads bot interactions')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('threads', 'Threads-specific operations')
    .addTag('insights', 'Thread analytics and insights')
    .build();

  const document = SwaggerModule.createDocument(app, {
    ...config,
    components: {
      schemas: {
        ThreadsLoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Your Instagram username',
            },
            password: {
              type: 'string',
              description: 'Your Instagram password',
              format: 'password',
            },
          },
        },
        ThreadsLoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            session_id: {
              type: 'string',
            },
          },
        },
        ThreadsPostsResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string' },
            media_type: {
              type: 'string',
              enum: ['TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL'],
            },
            permalink: { type: 'string' },
            timestamp: { type: 'string' },
            reply_audience: {
              type: 'string',
              enum: ['EVERYONE', 'FOLLOWING', 'MENTIONED'],
            },
          },
        },
        ThreadsRepliesResponse: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            media_type: { type: 'string' },
            media_url: { type: 'string' },
            permalink: { type: 'string' },
            timestamp: { type: 'string' },
            username: { type: 'string' },
            hide_status: { type: 'boolean' },
            alt_text: { type: 'string' },
          },
        },
        ThreadsInsightsResponse: {
          type: 'object',
          properties: {
            metrics: {
              type: 'object',
              properties: {
                views: { type: 'number' },
                likes: { type: 'number' },
                replies: { type: 'number' },
                quotes: { type: 'number' },
                reposts: { type: 'number' },
                followersCount: { type: 'number' },
              },
            },
            since: { type: 'string', format: 'date-time' },
            until: { type: 'string', format: 'date-time' },
          },
        },
      },
      examples: {
        // Auth Examples
        TokenExchangeRequest: {
          value: {
            code: 'your_instagram_auth_code',
          },
          description: 'Request body for token exchange',
        },
        TokenExchangeResponse: {
          value: {
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            token_type: 'Bearer',
            expires_in: 3600,
          },
          description: 'Successful token exchange response',
        },
        TokenInfoResponse: {
          value: {
            valid: true,
            expires_at: '2024-01-13T00:00:00.000Z',
            scopes: ['basic', 'threads'],
          },
          description: 'Token information response',
        },

        // Threads Examples
        ThreadsLoginRequest: {
          value: {
            username: 'your_username',
            password: 'your_password',
          },
          description: 'Login request for Threads',
        },
        ThreadsLoginResponse: {
          value: {
            success: true,
            session_id: 'session_xyz_123',
          },
          description: 'Successful login response',
        },
        CreatePostRequest: {
          value: {
            text: 'Hello from Threads API!',
            media_ids: ['optional_media_id'],
          },
          description: 'Create new thread post request',
        },
        CreatePostResponse: {
          value: {
            post_id: 'thread_post_123',
            text: 'Hello from Threads API!',
            created_at: '2024-01-12T12:00:00.000Z',
          },
          description: 'Successful post creation response',
        },
        ProfileResponse: {
          value: {
            username: 'zuck',
            full_name: 'Mark Zuckerberg',
            follower_count: 3000000,
            following_count: 1000,
            bio: 'Meta CEO',
          },
          description: 'Profile information response',
        },
        ErrorUnauthorized: {
          value: {
            statusCode: 401,
            message: 'Unauthorized',
            error: 'Invalid or expired token',
          },
          description: 'Unauthorized error response',
        },
        ErrorBadRequest: {
          value: {
            statusCode: 400,
            message: 'Bad Request',
            error: 'Invalid input parameters',
          },
          description: 'Bad request error response',
        },
        AuthFlow: {
          value: {
            steps: [
              {
                description: '1. Redirect user to Instagram OAuth URL',
                url: `https://api.instagram.com/oauth/authorize?client_id=${process.env.THREADS_APP_ID}&redirect_uri=${process.env.THREADS_REDIRECT_CALLBACK_URL}&scope=threads_api&response_type=code`,
              },
              {
                description: '2. Exchange code for access token',
                request: {
                  method: 'POST',
                  url: '/auth/token/exchange',
                  body: {
                    code: 'AQD8h7qtQyJ...',
                  },
                },
                response: {
                  access_token: 'IGQWRPcG...',
                  token_type: 'Bearer',
                  expires_in: 3600,
                },
              },
              {
                description: '3. Use token in Threads API requests',
                request: {
                  method: 'POST',
                  url: '/threads/posts',
                  headers: {
                    Authorization: 'Bearer IGQWRPcG...',
                  },
                  body: {
                    content: 'Hello from Threads API!',
                  },
                },
              },
            ],
          },
          description: 'Complete authentication flow example',
        },
        GetUserPostsResponse: {
          value: {
            data: [
              {
                id: '18050322910881011',
                text: 'Check out this cool feature!',
                media_type: 'TEXT',
                permalink: 'https://threads.net/p/123',
                timestamp: '2024-01-13T12:00:00Z',
                reply_audience: 'EVERYONE',
              },
            ],
            paging: {
              next: 'cursor_next',
              previous: 'cursor_prev',
            },
          },
          description: 'List of user posts with pagination',
        },
        GetPostRepliesResponse: {
          value: {
            data: [
              {
                text: 'Great post!',
                media_type: 'TEXT',
                permalink: 'https://threads.net/p/reply123',
                timestamp: '2024-01-13T12:05:00Z',
                username: 'user123',
                hide_status: false,
              },
            ],
            paging: {
              next: 'cursor_next',
              previous: 'cursor_prev',
            },
          },
          description: 'List of replies to a thread',
        },
        GetUserInsightsResponse: {
          value: {
            metrics: {
              views: 1000,
              likes: 500,
              replies: 50,
              quotes: 20,
              reposts: 30,
              followersCount: 5000,
            },
            since: '2024-01-01T00:00:00Z',
            until: '2024-01-13T23:59:59Z',
          },
          description: 'User insights and metrics',
        },
      },
    },
  });

  // Serve OpenAPI JSON at /openapi.json
  app.use('/openapi.json', (req, res) => {
    res.json(document);
  });

  // Optional: Also serve Swagger UI at /api
  SwaggerModule.setup('api', app, document);

  // Serve Scalar documentation
  app.use(
    '/docs',
    apiReference({
      spec: {
        url: '/openapi.json',
      },
      theme: 'nest',
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Get server URL
  const serverUrl = await app.getUrl();

  console.log('\n' + chalk.yellow('━'.repeat(50)));
  console.log(`\n${chalk.bold('🚀 Server Successfully Started!')}\n`);

  // Available Routes
  console.log(`${chalk.bold('📡 Available Routes:')}`);
  console.log(chalk.cyan('POST  /auth/token/exchange'));
  console.log(chalk.cyan('GET   /auth/token'));
  console.log(chalk.cyan('GET   /threads/:userId/posts'));
  console.log(chalk.cyan('GET   /threads/:userId/posts/:threadId/replies'));
  console.log(chalk.cyan('GET   /threads/:userId/insights'));
  console.log(chalk.cyan('GET   /health'));

  // Documentation URLs
  console.log(`\n${chalk.bold('📚 API Documentation:')}`);
  console.log(chalk.green(`✨ Scalar Docs:  ${serverUrl}/docs`));
  console.log(chalk.green(`📘 Swagger UI:   ${serverUrl}/api`));
  console.log(chalk.green(`🔧 OpenAPI JSON: ${serverUrl}/openapi.json`));

  console.log('\n' + chalk.yellow('━'.repeat(50)) + '\n');
}
bootstrap();
