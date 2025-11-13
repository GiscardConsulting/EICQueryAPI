# Multi-stage build for EIC Code API Service

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application (frontend + backend)
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

WORKDIR /app

# Install all dependencies (including drizzle-kit for schema management)
COPY package*.json ./
RUN npm ci

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy necessary files for runtime
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./

# Expose application port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
