FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

# npm ci thay vì npm install --include=dev để đảm bảo
# install từ lockfile, đúng platform musl
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "--port", "3000"]