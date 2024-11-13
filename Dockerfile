# syntax = docker/dockerfile:1

# Use the official Bun image as base
FROM oven/bun:latest as base
LABEL fly_launch_runtime="NestJS"
WORKDIR /app
ENV NODE_ENV=production

# Build stage
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential 

# Copy package files
COPY --link package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy the rest of the code
COPY --link . .

# Build the app
RUN bun run build

# Production stage
FROM base

WORKDIR /app

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lockb ./bun.lockb

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose the port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start:prod"]