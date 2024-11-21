# Threads Bot API

[![Nest Logo](https://nestjs.com/img/logo-small.svg)](http://nestjs.com/)

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
- 🔑 Handle Threads OAuth authentication
- 👤 Fetch user profiles and interactions
- 🔄 Manage user sessions

## Authentication Flow

- **Get Threads OAuth Code**

```bash
https://threads.net/oauth/authorize
  ?client_id=<THREADS_APP_ID>
  &redirect_uri=<REDIRECT_URI>
  &scope=<SCOPE>
  &response_type=code
  &state=<STATE> // Optional

```

```javascript
window.open(url, '_system');`
```

- **Exchange Code for Token**

```bash
curl -X POST http://localhost:3000/auth/token/exchange \
-H "Content-Type: application/json" \
-d '{"code": "your_threads_auth_code"}'
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
# Exchange Threads code for token
POST /auth/token/exchange

# Get token info
GET /auth/token

# Login with Threads credentials
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
