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

// 읽기 관련 라우트
router.put('/all/read', notificationController.markAllNotificationsAsRead);
router.put('/batch/read', validate(updateMultipleNotificationsSchema), notificationController.updateMultipleNotificationsReadStatus);
router.put('/:id/read', validate(updateNotificationReadStatusSchema), notificationController.updateNotificationReadStatus);

// 알림 삭제 라우트
router.delete('/all', notificationController.deleteAllNotifications);
router.delete('/:id', notificationController.deleteNotification);

export default router;