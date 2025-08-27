# SmartChoice AI - Railway Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code and data
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S smartchoice -u 1001

# Change ownership of the app directory
RUN chown -R smartchoice:nodejs /app
USER smartchoice

# Expose port (Railway will override this)
EXPOSE 3000

# Health check (uses dynamic PORT)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Start the application
CMD ["npm", "start"]
