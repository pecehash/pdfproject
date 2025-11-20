FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY ./src ./src
RUN mkdir -p /app/storage/merged

EXPOSE 4000
CMD ["node", "src/server.js"]