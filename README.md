<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Threads Bot API

A NestJS wrapper for the official Threads GraphQL API, built with Bun runtime. This API simplifies interaction with Threads' functionality through REST endpoints.

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Run in development
bun run start:dev
```

## Core Features

- ✨ Create and manage Threads posts
- 🔑 Handle Instagram OAuth authentication
- 👤 Fetch user profiles and interactions
- 🔄 Manage user sessions

## Authentication Flow

1. **Get Instagram OAuth Code**
```bash
https://api.instagram.com/oauth/authorize
?client_id=YOUR_APP_ID
&redirect_uri=YOUR_CALLBACK_URL
&scope=threads_api
&response_type=code
```

2. **Exchange Code for Token**
```bash
curl -X POST http://localhost:3000/auth/token/exchange \
-H "Content-Type: application/json" \
-d '{"code": "your_instagram_auth_code"}'
```

## API Endpoints

### Posts

```bash
# Create a new post
POST /threads/posts
{
    "text": "Hello Threads!",
    "media_ids": ["optional_media_id"]
}

# Get user's posts
GET /threads/posts/:username
```

### Profile

```bash
# Get user profile
GET /threads/profile/:username

# Get user's followers
GET /threads/profile/:username/followers
```

### Authentication

```bash
# Exchange Instagram code for token
POST /auth/token/exchange

# Get token info
GET /auth/token

# Login with Instagram credentials
POST /threads/login
```

## Environment Setup

```bash
PORT=3000
THREADS_APP_ID=your_app_id
THREADS_DEVICE_ID=your_device_id
THREADS_REDIRECT_CALLBACK_URL=your_callback_url
```

> **Important**: Configure callback URIs in Meta Developer Dashboard under your app's Threads API use case settings.

## Database

The API uses MongoDB for data persistence. Set your connection string in `.env`:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/threads_bot
```

## Documentation

- 📚 API Docs: `http://localhost:3000/docs`
- 🔧 OpenAPI: `http://localhost:3000/openapi.json`

## License

GPL-3.0

