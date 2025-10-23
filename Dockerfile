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
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# ! DEVELOPMENT STEP
# Development image with hot reload and all dependencies
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# ! RUNNER STEP
# Production image, copy all the files and run the app
# Only production dependencies + compiled code
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gympal

# Copy the built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/openapi.json ./openapi.json
COPY --from=builder /app/env ./env

# Create a non-root user
USER gympal

# Expose the port the app runs on
EXPOSE 3000

ENV PORT=3000

# Start the application
CMD ["node", "dist/index.js"]
# CMD ["npm", "start"] slower build
