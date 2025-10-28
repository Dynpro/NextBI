# Example Dockerfile snippet
FROM node:18-alpine


WORKDIR /app


COPY package*.json ./
RUN npm install


COPY . .


# Copy the .env
COPY .env .env


CMD ["npm", "run", "dev"]
