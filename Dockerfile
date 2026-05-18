# Use the official pre-configured Puppeteer/Node image (already has Chrome and dependencies)
FROM ghcr.io/puppeteer/puppeteer:21.5.0

USER root

# Set the working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy all source files
COPY . .

# Expose the server port
EXPOSE 5000

# Start the Node.js server
CMD ["node", "src/index.js"]
