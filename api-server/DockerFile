FROM node:18-alpine

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install
RUN npm install -g prisma

# 소스 파일 복사
COPY . .

# Prisma 생성 
RUN npx prisma generate

EXPOSE 3000

# 시작 명령어
CMD ["npm", "start"]