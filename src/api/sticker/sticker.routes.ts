import express from 'express';
import * as stickerController from './sticker.controller';
import { validate } from '../../middleware/validation.middleware';
import { 
  authenticate, 
  requireParent, 
  requireChild, 
  checkParentChildRelationship 
} from '../../middleware/auth.middleware';
import { uploadStickerImage } from '../../middleware/upload.middleware';
import { createStickerSchema } from './sticker.validation';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 부모 라우트
router.post('/', requireParent, uploadStickerImage, validate(createStickerSchema), stickerController.createSticker);
router.get('/child/:childId', requireParent, checkParentChildRelationship, stickerController.getChildStickersByParent);
router.delete('/:id', requireParent, stickerController.deleteSticker);
// 부모가 특정 자녀의 스티커 개수 조회
router.get('/child/:childId/count', requireParent, checkParentChildRelationship, stickerController.getChildStickerCount);

// 자녀 라우트
router.get('/child', requireChild, stickerController.getChildStickers);
router.get('/stats', requireChild, stickerController.getChildStickerStats);

// 공통 라우트
router.get('/:id', stickerController.getStickerById);

export default router;