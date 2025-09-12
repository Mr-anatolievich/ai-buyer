# AI-Buyer Frontend Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine as builder

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build arguments
ARG REACT_APP_API_URL=http://localhost:8000
ARG REACT_APP_WS_URL=ws://localhost:8000
ARG REACT_APP_ENVIRONMENT=production

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine as production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development stage
FROM node:18-alpine as development

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

# Expose port for development server
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]