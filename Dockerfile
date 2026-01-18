# Use Node.js 20 with full build tools
FROM node:20-bullseye-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    sqlite3 \
    libsqlite3-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Set environment variables for native module compilation
ENV PYTHON=/usr/bin/python3
ENV npm_config_python=/usr/bin/python3

# Install dependencies with legacy peer deps to handle version conflicts
RUN npm ci --omit=dev --legacy-peer-deps

# Copy source code
COPY . .

# Set Prisma to use npm instead of bun
ENV PRISMA_CLI_BINARY_TARGETS=native
ENV PRISMA_GENERATE_SKIP_AUTOINSTALL=true

# Install Prisma client explicitly with npm
RUN npm install @prisma/client

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create uploads directory
RUN mkdir -p public/uploads

# Expose port
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]