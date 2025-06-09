import express from 'express';
import * as notificationController from './notification.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getNotificationsSchema,
  updateNotificationReadStatusSchema,
  updateMultipleNotificationsSchema
} from './notification.validation';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 알림 조회 라우트
router.get('/', validate(getNotificationsSchema, 'query'), notificationController.getNotifications);
router.get('/:id', notificationController.getNotificationById);

// 알림 읽음 상태 업데이트 라우트
router.put('/:id/read', validate(updateNotificationReadStatusSchema), notificationController.updateNotificationReadStatus);
router.put('/batch/read', validate(updateMultipleNotificationsSchema), notificationController.updateMultipleNotificationsReadStatus);
router.put('/all/read', notificationController.markAllNotificationsAsRead);

// 알림 삭제 라우트
router.delete('/:id', notificationController.deleteNotification);
router.delete('/all', notificationController.deleteAllNotifications);

export default router;