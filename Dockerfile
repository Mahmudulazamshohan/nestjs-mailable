# Use official Node.js 24 image
FROM node:24-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Expose port (if needed for demo/examples)
EXPOSE 3000

# Default command
CMD ["node", "./dist/examples/demo.js"]
