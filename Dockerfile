FROM node:16-alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
# COPY package*.json ./

RUN yarn --production
# RUN npm ci --only=production

COPY . .

EXPOSE 8080
CMD ["node", "index.js"]
