import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { ApiError } from './error.middleware';

// 업로드 디렉토리 생성
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const promiseImageDir = path.join(uploadDir, 'promises');
const profileImageDir = path.join(uploadDir, 'profiles');
const stickerImageDir = path.join(uploadDir, 'stickers');

// 디렉토리 생성 함수
const createDirIfNotExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 각 디렉토리 생성
createDirIfNotExists(promiseImageDir);
createDirIfNotExists(profileImageDir);
createDirIfNotExists(stickerImageDir);

// 파일 필터 - 이미지 파일만 허용
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError('지원되지 않는 파일 형식입니다. JPEG, PNG, GIF만 허용됩니다.', 400) as any);
  }
};

// 스토리지 설정 - 약속 인증 이미지
const promiseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, promiseImageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `promise-${uniqueSuffix}${ext}`);
  }
});

// 스토리지 설정 - 프로필 이미지
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileImageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

// 스토리지 설정 - 스티커 이미지
const stickerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, stickerImageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `sticker-${uniqueSuffix}${ext}`);
  }
});

// 업로드 미들웨어 생성
export const uploadPromiseImage = multer({
  storage: promiseStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter
}).single('image');

export const uploadProfileImage = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB 제한
  fileFilter
}).single('image');

export const uploadStickerImage = multer({
  storage: stickerStorage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB 제한
  fileFilter
}).single('image');

