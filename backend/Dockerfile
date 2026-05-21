# Dev stage — used by docker-compose.dev.yml
FROM node:24.11.1-alpine AS dev

RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN npm install -g pnpm@10.27.0 && \
    pnpm install --frozen-lockfile

COPY shared/ ./shared/

EXPOSE 3000
WORKDIR /app/backend
CMD ["pnpm", "dev"]

# Build stage
FROM node:24.11.1-alpine AS builder

RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install pnpm and all workspace dependencies
RUN npm install -g pnpm@10.27.0 && \
    pnpm install --frozen-lockfile

# Copy source
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build the backend
WORKDIR /app/backend
RUN pnpm build

# Production stage
FROM node:24.11.1-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install production dependencies only
RUN npm install -g pnpm@10.27.0 && \
    pnpm install --frozen-lockfile --prod

# Copy shared source (needed at runtime for transpilePackages)
COPY shared/ ./shared/

# Copy built application from builder
COPY --from=builder /app/backend/.next ./backend/.next

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

WORKDIR /app/backend
CMD ["pnpm", "start"]
