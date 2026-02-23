# ================================
# Stage 1: Build
# ================================
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_URL

ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# ================================
# Stage 2: Runtime with Node.js
# ================================
FROM node:22-alpine AS runtime
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit

# Use existing node user (UID/GID 1000) instead of creating a new one
# permissions for app directory
RUN chown -R node:node /app

# Copy build output and server
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server.cjs ./

# Install curl for healthcheck
RUN apk add --no-cache curl

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the server
CMD ["node", "server.cjs"]
