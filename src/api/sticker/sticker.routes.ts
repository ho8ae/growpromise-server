import express from 'express';
import * as stickerController from './sticker.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate, requireParent } from '../../middleware/auth.middleware';
import { uploadStickerImage } from '../../middleware/upload.middleware';
import { createStickerSchema } from './sticker.validation';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 부모 라우트
router.post('/', requireParent, uploadStickerImage, validate(createStickerSchema), stickerController.createSticker);
router.get('/child/:childId', requireParent, stickerController.getChildStickersByParent);
router.delete('/:id', requireParent, stickerController.deleteSticker);

// 자녀 라우트
router.get('/child', stickerController.getChildStickers);
router.get('/stats', stickerController.getChildStickerStats);

// 공통 라우트
router.get('/:id', stickerController.getStickerById);

export default router;