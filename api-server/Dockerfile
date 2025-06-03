FROM node:18-slim

# 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g prisma

COPY . ./

RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]