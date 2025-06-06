FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Set environment and install dependencies
ENV COREPACK_ENABLE_STRICT=0
RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install

# Copy application files
COPY . .

EXPOSE 3000

# Use npx next dev to start
CMD ["npx", "next", "dev"]