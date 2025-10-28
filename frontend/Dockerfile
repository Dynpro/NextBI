# Stage 1: Build the React app
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json / yarn.lock first
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy all files
COPY . .

# Build the production-ready app
RUN npx vite build

# Stage 2: Run the app using a lightweight web server (nginx)
FROM nginx:alpine

# Copy built files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
