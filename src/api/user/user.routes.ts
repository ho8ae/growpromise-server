import express from 'express';
import * as userController from './user.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { uploadProfileImage } from '../../middleware/upload.middleware';
import { updateProfileSchema, getUsersQuerySchema } from './user.validation';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 프로필 라우트
router.get('/profile', userController.getUserProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateUserProfile);
router.patch('/profile/image', uploadProfileImage, userController.updateProfileImage);

// 관계 라우트
router.get('/children', userController.getParentChildren);
router.get('/parents', userController.getChildParents);

// 사용자 조회 라우트
router.get('/:id', userController.getUserById);

export default router;