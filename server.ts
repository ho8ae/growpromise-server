import { app } from './src/app';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 환경 변수 로드
dotenv.config();

// 업로드 디렉토리 확인 및 생성
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const dirs = [
  uploadDir,
  path.join(uploadDir, 'promises'),
  path.join(uploadDir, 'profiles'),
  path.join(uploadDir, 'stickers')
];

// 각 디렉토리 확인 및 생성
for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    console.log(`디렉토리 생성: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

const PORT = parseInt(process.env.PORT || '3000',10);

// 서버 시작
app.listen(PORT,'0.0.0.0', () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
});

// 예기치 않은 오류 처리
process.on('uncaughtException', (error) => {
  console.error('예기치 않은 오류:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('처리되지 않은 거부:', reason);
});