// src/api/notification/notification.service.ts
import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';
import { NotificationType } from '@prisma/client';
import pushNotificationService from '../../utils/pushNotificationService';

/**
 * 알림 생성 + 푸시 알림 전송
 */
export const createNotification = async (
  userId: string,
  title: string,
  content: string,
  notificationType: NotificationType,
  relatedId: string | null
) => {
  // 1. DB에 알림 저장
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      content,
      notificationType,
      relatedId,
      isRead: false
    }
  });

  // 2. 푸시 알림 전송 (백그라운드에서도 즉시 알림!)
  try {
    await pushNotificationService.sendPushNotification(
      userId,
      title,
      content,
      {
        notificationId: notification.id,
        type: notificationType,
        relatedId
      }
    );
  } catch (error) {
    console.error('푸시 알림 전송 실패:', error);
    // 푸시 실패해도 DB 알림은 저장됨
  }
  
  return notification;
};

/**
 * 약속 관련 알림 생성 헬퍼
 */
export const createPromiseNotification = async (
  userId: string,
  promiseTitle: string,
  type: 'created' | 'verified' | 'approved' | 'rejected',
  promiseId: string
) => {
  const notifications = {
    created: {
      title: '새로운 약속이 생겼어요! 🎯',
      content: `"${promiseTitle}" 약속을 확인해보세요.`,
      notificationType: NotificationType.PROMISE_CREATED
    },
    verified: {
      title: '약속 인증을 확인해주세요! 📸', 
      content: `아이가 "${promiseTitle}" 약속을 인증했어요.`,
      notificationType: NotificationType.PROMISE_VERIFIED
    },
    approved: {
      title: '약속을 잘 지켰어요! 🌟',
      content: `"${promiseTitle}" 약속이 승인되었어요.`,
      notificationType: NotificationType.PROMISE_APPROVED
    },
    rejected: {
      title: '약속을 다시 시도해보세요 💪',
      content: `"${promiseTitle}" 약속을 다시 도전해보세요.`,
      notificationType: NotificationType.PROMISE_REJECTED
    }
  };

  const notificationData = notifications[type];
  
  return await createNotification(
    userId,
    notificationData.title,
    notificationData.content,
    notificationData.notificationType,
    promiseId
  );
};

/**
 * 보상 관련 알림 생성 헬퍼
 */
export const createRewardNotification = async (
  userId: string,
  rewardName: string,
  stickerCount: number,
  rewardId: string
) => {
  return await createNotification(
    userId,
    '보상을 획득했어요! 🎁',
    `${rewardName}을(를) 획득했어요! (스티커 ${stickerCount}개)`,
    NotificationType.REWARD_EARNED,
    rewardId
  );
};

/**
 * 식물 관련 알림 생성 헬퍼
 */
export const createPlantNotification = async (
  userId: string,
  plantName: string,
  type: 'growth' | 'completion' | 'reminder',
  plantId: string
) => {
  const notifications = {
    growth: {
      title: '식물이 성장했어요! 🌱',
      content: `${plantName}이(가) 한 단계 성장했어요!`
    },
    completion: {
      title: '식물 키우기 완성! 🌟',
      content: `${plantName}을(를) 성공적으로 키웠어요!`
    },
    reminder: {
      title: '물 줄 시간이에요! 💧',
      content: `${plantName}이(가) 물을 기다리고 있어요.`
    }
  };

  const notificationData = notifications[type];
  
  return await createNotification(
    userId,
    notificationData.title,
    notificationData.content,
    NotificationType.SYSTEM,
    plantId
  );
};

// 기존 함수들 유지
export const getNotifications = async (
  userId: string,
  isRead?: boolean,
  limit: number = 20,
  offset: number = 0
) => {
  const where: any = {
    userId
  };

  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    skip: offset,
    take: limit
  });

  const total = await prisma.notification.count({
    where
  });

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

export const updateMultipleNotificationsReadStatus = async (
  notificationIds: string[],
  userId: string,
  isRead: boolean
) => {
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