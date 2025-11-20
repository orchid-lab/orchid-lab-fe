# Stage 1: Build the application
FROM node:lts-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "--port", "3000"]