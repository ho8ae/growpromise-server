import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// 라우터 임포트
import authRoutes from './api/auth/auth.routes';
import userRoutes from './api/user/user.routes';
import promiseRoutes from './api/promise/promise.routes';
import rewardRoutes from './api/reward/reward.routes';
import stickerRoutes from './api/sticker/sticker.routes';
import notificationRoutes from './api/notification/notification.routes';

// 미들웨어 임포트
import { errorHandler } from './middleware/error.middleware';

// Prisma 클라이언트 인스턴스 생성
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Express 앱 생성
const app: Application = express();

// 기본 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (업로드된 이미지 등)
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

// API 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/promises', promiseRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/notifications', notificationRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: '쑥쑥약속 API 서버에 연결되었습니다.',
    version: '1.0.0',
    status: 'running'
  });
});

// 존재하지 않는 라우트에 대한 핸들러
app.use((req, res, next) => {
  res.status(404).json({
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.path
  });
});

// 에러 핸들링 미들웨어 (항상 가장 마지막에 등록)
app.use(errorHandler);

// 앱 내보내기
export { app };