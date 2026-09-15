FROM node:18-alpine

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

