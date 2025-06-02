import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';
import { NotificationType } from '@prisma/client';

/**
 * 알림 생성
 */
export const createNotification = async (
  userId: string,
  title: string,
  content: string,
  notificationType: NotificationType,
  relatedId: string | null
) => {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      content,
      notificationType,
      relatedId,
      isRead: false
    }
  });
};

/**
 * 알림 목록 조회
 */
export const getNotifications = async (
  userId: string,
  isRead?: boolean,
  limit: number = 20,
  offset: number = 0
) => {
  // 필터링 조건 구성
  const where: any = {
    userId
  };

  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  // 알림 목록 조회
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    skip: offset,
    take: limit
  });

  // 총 알림 수 조회
  const total = await prisma.notification.count({
    where
  });

  // 읽지 않은 알림 수 조회
  const unreadCount = await prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });

  return {
    notifications,
    total,
    unreadCount
  };
};

/**
 * 알림 상세 조회
 */
export const getNotificationById = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification) {
    throw new ApiError('알림을 찾을 수 없습니다.', 404);
  }

  if (notification.userId !== userId) {
    throw new ApiError('이 알림에 대한 접근 권한이 없습니다.', 403);
  }

  return notification;
};

/**
 * 알림 읽음 상태 업데이트
 */
export const updateNotificationReadStatus = async (
  notificationId: string,
  userId: string,
  isRead: boolean
) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification) {
    throw new ApiError('알림을 찾을 수 없습니다.', 404);
  }

  if (notification.userId !== userId) {
    throw new ApiError('이 알림에 대한 접근 권한이 없습니다.', 403);
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead }
  });
};

/**
 * 알림 여러 개 읽음 상태 업데이트
 */
export const updateMultipleNotificationsReadStatus = async (
  notificationIds: string[],
  userId: string,
  isRead: boolean
) => {
  // 모든 알림이 사용자의 것인지 확인
  const notifications = await prisma.notification.findMany({
    where: {
      id: { in: notificationIds }
    }
  });

  if (notifications.length !== notificationIds.length) {
    throw new ApiError('일부 알림을 찾을 수 없습니다.', 404);
  }

  const nonUserNotifications = notifications.filter(note => note.userId !== userId);
  if (nonUserNotifications.length > 0) {
    throw new ApiError('일부 알림에 대한 접근 권한이 없습니다.', 403);
  }

  // 알림 읽음 상태 업데이트
  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId
    },
    data: { isRead }
  });

  return {
    updatedCount: notificationIds.length
  };
};

/**
 * 모든 알림 읽음으로 표시
 */
export const markAllNotificationsAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: { isRead: true }
  });

  return {
    updatedCount: result.count
  };
};

/**
 * 알림 삭제
 */
export const deleteNotification = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  });

  if (!notification) {
    throw new ApiError('알림을 찾을 수 없습니다.', 404);
  }

  if (notification.userId !== userId) {
    throw new ApiError('이 알림에 대한 접근 권한이 없습니다.', 403);
  }

  return await prisma.notification.delete({
    where: { id: notificationId }
  });
};

/**
 * 모든 알림 삭제
 */
export const deleteAllNotifications = async (userId: string) => {
  const result = await prisma.notification.deleteMany({
    where: {
      userId
    }
  });

  return {
    deletedCount: result.count
  };
};