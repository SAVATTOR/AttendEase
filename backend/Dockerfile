FROM node:18-alpine

# Prisma's query engine links against OpenSSL. Alpine ships none by default, so Prisma
# cannot detect a version, falls back to its OpenSSL 1.1 engine and then fails to load
# libssl.so.1.1, which Alpine 3.18 does not carry. libc6-compat covers the glibc symbols
# the engine expects on musl.
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npm run prisma:generate

# Copy application code
COPY . .

# Expose port
EXPOSE 10000

# Start server
CMD ["npm", "start"]

