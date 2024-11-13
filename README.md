<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Threads Bot API

A NestJS-based API for interacting with the official Threads GraphQL API, built with Bun runtime.

## Quick Start

```bash
# Install dependencies
bun install

# Run in development
bun run start:dev

# Run in production
bun run start
```


## Authentication Flow

### 1. Get Instagram OAuth Code

First, redirect users to the Instagram OAuth URL:

```bash
https://api.instagram.com/oauth/authorize
?client_id=YOUR_APP_ID
&redirect_uri=YOUR_CALLBACK_URL
&scope=threads_api
&response_type=code
```

### 2. Exchange Code for Token

After receiving the code from the redirect URL:

```bash
curl -X POST http://localhost:3000/auth/token/exchange \
-H "Content-Type: application/json" \
-d '{
"code": "AQD8h7qtQyJ..."
}'
```

Response:

```json
{
"access_token": "IGQWRPcG...",
"token_type": "Bearer",
"expires_in": 3600
}
```


### 3. Use Token for API Requests

All subsequent requests should include the Bearer token:

```bash
curl -X POST http://localhost:3000/threads/posts \
-H "Authorization: Bearer IGQWRPcG..." \
-H "Content-Type: application/json" \
-d '{
"content": "Hello from Threads API!"
}'
```


## Available Endpoints

### Posts

#### Create Post (`POST /threads/posts`)

```bash
curl -X POST http://localhost:3000/threads/posts \
-H "Authorization: Bearer your_token" \
-H "Content-Type: application/json" \
-d '{
"content": "Hello from Threads API!"
}'
```

### Profiles

#### Get Profile (`GET /threads/profile/:username`)

```bash
curl -X GET http://localhost:3000/threads/profile/zuck \
-H "Authorization: Bearer your_token"
```



## API Documentation

API documentation is available at:
- Scalar Docs: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## Authentication Routes

### 1. Exchange Token (`POST /auth/token/exchange`)

Exchange an Instagram authentication code for an access token.

```bash
curl -X POST http://localhost:3000/auth/token/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "code": "your_instagram_auth_code"
  }'
```

Response:
```json
{
  "access_token": "your_access_token",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 2. Get Token Info (`GET /auth/token`)

Retrieve information about the current access token.

```bash
curl -X GET http://localhost:3000/auth/token \
  -H "Authorization: Bearer your_access_token"
```

Response:
```json
{
  "valid": true,
  "expires_at": "2024-01-13T00:00:00.000Z",
  "scopes": ["basic", "threads"]
}
```

### 3. Threads Login (`POST /threads/login`)

Authenticate with Threads using Instagram credentials.

```bash
curl -X POST http://localhost:3000/threads/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

Response:
```json
{
  "success": true,
  "session_id": "your_session_id"
}
```

### 4. Create Thread Post (`POST /threads/posts`)

Create a new post on Threads.

```bash
curl -X POST http://localhost:3000/threads/posts \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from Threads API!",
    "media_ids": ["optional_media_id"]
  }'
```

Response:
```json
{
  "post_id": "thread_post_id",
  "text": "Hello from Threads API!",
  "created_at": "2024-01-12T12:00:00.000Z"
}
```

### 5. Get Profile (`GET /threads/profile/:username`)

Retrieve a user's Threads profile information.

```bash
curl -X GET http://localhost:3000/threads/profile/zuck \
  -H "Authorization: Bearer your_access_token"
```

Response:
```json
{
  "username": "zuck",
  "full_name": "Mark Zuckerberg",
  "follower_count": 3000000,
  "following_count": 1000,
  "bio": "Meta CEO"
}
```

## Error Responses

### Unauthorized (401)

All endpoints may return the following error responses:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Invalid input parameters"
}
```

## API Documentation

The API documentation is available at these endpoints:

- ✨ Scalar Docs: `http://localhost:3000/docs`
- 📘 Swagger UI: `http://localhost:3000/api`
- 🔧 OpenAPI JSON: `http://localhost:3000/openapi.json`

## Environment Variables

Create a `.env` file with:

```bash
env
PORT=3000
THREADS_APP_ID=your_app_id
THREADS_DEVICE_ID=your_device_id
THREADS_REDIRECT_CALLBACK_URL=your_callback_url
```

>make sure you go to meta dev app with threads api use case -> gho to dashboard -> use case -> settings -> set the callbak uris!


## License

GPL-3.0

