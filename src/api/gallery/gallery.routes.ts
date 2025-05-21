// src/api/gallery/gallery.routes.ts
import express from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as galleryController from './gallery.controller';
import { validate } from '../../middleware/validation.middleware';
import { toggleFavoriteSchema } from './gallery.validation';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 부모용 갤러리 이미지 조회
router.get('/', galleryController.getParentGalleryImages);

// 자녀용 갤러리 이미지 조회
router.get('/child', galleryController.getChildGalleryImages);

// 갤러리 이미지 상세 조회
router.get('/:id', galleryController.getGalleryImageById);

// 갤러리 이미지 즐겨찾기 토글
router.put('/:id/favorite', validate(toggleFavoriteSchema), galleryController.toggleImageFavorite);

// 갤러리 이미지 삭제
router.delete('/:id', galleryController.deleteGalleryImage);

export default router;