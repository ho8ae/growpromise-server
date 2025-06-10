import express from 'express';
import * as userController from './user.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
// import { uploadProfileImage } from '../../middleware/upload.middleware';
import { 
  updateProfileSchema, 
  updateDetailProfileSchema,
  selectAvatarSchema,
  updatePushTokenSchema,
  updateNotificationSettingsSchema,
  updatePushTokenLegacySchema
} from './user.validation';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 기본 프로필 라우트
router.get('/profile', userController.getUserProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateUserProfile);

// 상세 프로필 라우트
router.get('/profile/detail', userController.getUserDetailProfile);
router.put('/profile/detail', validate(updateDetailProfileSchema), userController.updateUserDetailProfile);

// 아바타 관련 라우트
router.get('/profile/avatars', userController.getAvailableAvatars);
router.put('/profile/avatar', validate(selectAvatarSchema), userController.selectProfileAvatar);

// 계정 상태 조회
router.get('/account-status', userController.getUserAccountStatus);

// 푸시 알림 관련 라우트 추가
router.post('/push-token', validate(updatePushTokenSchema), userController.updatePushToken);
router.get('/notification-settings', userController.getNotificationSettings);
router.put('/notification-settings', validate(updateNotificationSettingsSchema), userController.updateNotificationSettings);
router.post('/test-push', userController.sendTestPushNotification);
router.post('/push-token/legacy', validate(updatePushTokenLegacySchema), userController.updatePushTokenLegacy);

// 관계 라우트  
router.get('/children', userController.getParentChildren);
router.get('/parents', userController.getChildParents);

// 사용자 조회 라우트
router.get('/:id', userController.getUserById);

/* 
// S3 이미지 업로드 라우트 (나중에 필요할 때 주석 해제)
router.patch('/profile/image', uploadProfileImage, userController.updateProfileImage);
*/

export default router;