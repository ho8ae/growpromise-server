import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as notificationService from './notification.service';

/**
 * 알림 목록 조회
 * @route GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { isRead, limit, offset } = req.query;
  
  const result = await notificationService.getNotifications(
    req.user.id,
    isRead === 'true' ? true : isRead === 'false' ? false : undefined,
    limit ? parseInt(limit as string) : 20,
    offset ? parseInt(offset as string) : 0
  );
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * 알림 상세 조회
 * @route GET /api/notifications/:id
 */
export const getNotificationById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  const notification = await notificationService.getNotificationById(id, req.user.id);
  
  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * 알림 읽음 상태 업데이트
 * @route PATCH /api/notifications/:id/read
 */
export const updateNotificationReadStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  const { isRead } = req.body;
  
  const result = await notificationService.updateNotificationReadStatus(id, req.user.id, isRead);
  
  res.status(200).json({
    success: true,
    message: `알림이 ${isRead ? '읽음' : '읽지 않음'}으로 표시되었습니다.`,
    data: result
  });
});

/**
 * 알림 여러 개 읽음 상태 업데이트
 * @route PATCH /api/notifications/batch/read
 */
export const updateMultipleNotificationsReadStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { notificationIds, isRead } = req.body;
  
  const result = await notificationService.updateMultipleNotificationsReadStatus(notificationIds, req.user.id, isRead);
  
  res.status(200).json({
    success: true,
    message: `${result.updatedCount}개의 알림이 ${isRead ? '읽음' : '읽지 않음'}으로 표시되었습니다.`,
    data: result
  });
});

/**
 * 모든 알림 읽음으로 표시
 * @route PATCH /api/notifications/all/read
 */
export const markAllNotificationsAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const result = await notificationService.markAllNotificationsAsRead(req.user.id);
  
  res.status(200).json({
    success: true,
    message: `${result.updatedCount}개의 알림이 읽음으로 표시되었습니다.`,
    data: result
  });
});

/**
 * 알림 삭제
 * @route DELETE /api/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  await notificationService.deleteNotification(id, req.user.id);
  
  res.status(200).json({
    success: true,
    message: '알림이 성공적으로 삭제되었습니다.'
  });
});

/**
 * 모든 알림 삭제
 * @route DELETE /api/notifications/all
 */
export const deleteAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const result = await notificationService.deleteAllNotifications(req.user.id);
  
  res.status(200).json({
    success: true,
    message: `${result.deletedCount}개의 알림이 성공적으로 삭제되었습니다.`,
    data: result
  });
});