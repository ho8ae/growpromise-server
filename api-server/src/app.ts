// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

// 라우터 임포트
import authRoutes from './api/auth/auth.routes';
import userRoutes from './api/user/user.routes';
import promiseRoutes from './api/promise/promise.routes';
import rewardRoutes from './api/reward/reward.routes';
import stickerRoutes from './api/sticker/sticker.routes';
import notificationRoutes from './api/notification/notification.routes';
import plantRoutes from './api/plant/plant.routes';
import galleryRoutes from './api/gallery/gallery.routes';
import ticketRoutes from './api/ticket/ticket.routes';
import missionRoutes from './api/mission/mission.routes';


// 미들웨어 임포트
import { errorHandler } from './middleware/error.middleware';

// Prisma 클라이언트 인스턴스 생성
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Express 앱 생성
const app: Application = express();

// Swagger 설정
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '쑥쑥약속 API',
      version: '1.0.0',
      description: '부모와 아이를 위한 약속 관리 앱 API',
      contact: {
        name: 'KidsPlan Team'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: '개발 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    path.resolve(__dirname, 'docs/*.js'),
    path.resolve(__dirname, 'api/**/*.routes.ts'),
    path.resolve(__dirname, 'api/**/*.controller.ts')
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '쑥쑥약속 API 문서'
}));

// API 스펙 JSON으로 가져오기
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 기본 미들웨어 설정
app.use(cors({
  origin: '*', // 개발 중에는 '*'로 설정, 프로덕션에서는 특정 도메인으로 제한
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('dev'));
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
app.use('/api/plants', plantRoutes);
app.use('/api/gallery', galleryRoutes);

app.use('/api/tickets', ticketRoutes);
app.use('/api/missions', missionRoutes);

// 기본 라우트
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: '쑥쑥약속 API 서버에 연결되었습니다.',
    version: '1.0.0',
    status: 'running',
    docs: '/api-docs'
  });
});

// 존재하지 않는 라우트에 대한 핸들러
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.path
  });
});

// 에러 핸들링 미들웨어 (항상 가장 마지막에 등록)
app.use(errorHandler);

// 앱 내보내기
export { app };