# Use lightweight Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Copy environment variables
COPY .env .env

# Expose backend port
EXPOSE 3001

# Run the development server
CMD ["npm", "run", "dev"]
