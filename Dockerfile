# syntax = docker/dockerfile:1

# Use the official Bun image
FROM oven/bun:latest as base

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--experimental-specifier-resolution=node"

# Build stage
FROM base as build

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies including chalk v5
RUN bun install
RUN bun add chalk@latest

# Copy application code
COPY . .

# Build application
RUN bun run build

# Production stage
FROM base

# Copy built application
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/bun.lockb /app/bun.lockb

# Install production dependencies only
RUN bun install --production

# Expose port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start:prod"]