# Use Node.js 20 LTS as base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ! DEPS STEP
# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci --force; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ! BUILDER STEP
# Rebuild the source code only when needed 
# Includes development dependencies (TypeScript, build tools, etc.)
FROM base AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm build

# ! BUILDCACHE STEP
# Optimized build stage for caching - includes dev dependencies for building
FROM base AS buildcache
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml* ./
COPY src ./src
COPY tsconfig.json ./
COPY openapi.json ./

# Install all dependencies (including dev) for building, then build
RUN pnpm install --frozen-lockfile
RUN pnpm build

# ! DEVELOPMENT STEP
# Development image with hot reload and all dependencies
FROM base AS development
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules

# Copy source files 
COPY package.json pnpm-lock.yaml* ./
COPY src ./src
COPY tsconfig.json ./
COPY openapi.json ./

EXPOSE 3000
CMD ["pnpm", "run", "dev"]

# ! RUNNER STEP
# Production image, copy all the files and run the app
# Only production dependencies + compiled code
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gympal

# Install pnpm and copy dependencies
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules

# Copy the built application and lockfile
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/openapi.json ./openapi.json

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Change to non-root user
USER gympal

# Expose the port the app runs on
EXPOSE 3000

ENV PORT=3000

# Start the application
CMD ["node", "dist/index.js"]
# CMD ["npm", "start"] slower build
