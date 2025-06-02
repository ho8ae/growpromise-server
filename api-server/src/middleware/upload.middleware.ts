// src/middleware/upload.middleware.ts
import multer from 'multer';
import { uploadToS3 } from '../config/s3.config';

// 메모리 스토리지 설정 (파일을 메모리에 버퍼로 저장)
const storage = multer.memoryStorage();

// 이미지 파일만 허용하도록 필터 설정
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드할 수 있습니다.'));
  }
};

// multer 설정
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 최대 5MB
  },
});

// 약속 인증 이미지 업로드 미들웨어
export const uploadPromiseImage = [
  // multer로 'verificationImage' 필드의 파일 처리
  upload.single('verificationImage'),
  
  // S3에 업로드하는 미들웨어
  async (req: any, res: any, next: any) => {
    try {
      const file = req.file;
      
      if (!file) {
        return next(); // 파일이 없으면 다음 미들웨어로 넘어감
      }

      // S3에 업로드
      const imageUrl = await uploadToS3(
        file.buffer,
        file.mimetype,
        'promise-verifications'
      );

      // req 객체에 S3 URL 저장
      req.fileUrl = imageUrl;
      
      next();
    } catch (error) {
      next(error);
    }
  },
];

// 프로필 이미지 업로드 미들웨어
export const uploadProfileImage = [
  upload.single('profileImage'),
  async (req: any, res: any, next: any) => {
    try {
      const file = req.file;
      
      if (!file) {
        return next();
      }

      // S3에 업로드
      const imageUrl = await uploadToS3(
        file.buffer,
        file.mimetype,
        'profile-images'
      );

      // req 객체에 S3 URL 저장
      req.fileUrl = imageUrl;
      
      next();
    } catch (error) {
      next(error);
    }
  },
];

// 스티커 이미지 업로드 미들웨어
export const uploadStickerImage = [
  upload.single('stickerImage'),
  async (req: any, res: any, next: any) => {
    try {
      const file = req.file;
      
      if (!file) {
        return next();
      }

      // S3에 업로드
      const imageUrl = await uploadToS3(
        file.buffer,
        file.mimetype,
        'sticker-images'
      );

      // req 객체에 S3 URL 저장
      req.fileUrl = imageUrl;
      
      next();
    } catch (error) {
      next(error);
    }
  },
];