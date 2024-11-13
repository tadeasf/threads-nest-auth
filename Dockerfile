# Build stage
FROM oven/bun:latest as build
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS="--experimental-specifier-resolution=node"

# Copy package files first to leverage caching
COPY package.json ./
COPY bun.lockb ./

# Install all dependencies (including dev dependencies)
RUN bun install

# Copy the rest of the application
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:latest
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy only necessary files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lockb ./bun.lockb

# Install only production dependencies
RUN bun install --production --no-save

EXPOSE 3000

CMD ["bun", "run", "start:prod"]