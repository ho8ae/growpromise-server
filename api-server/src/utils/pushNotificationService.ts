// src/utils/pushNotificationService.ts 
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '../app';

class PushNotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true
    });
  }

  /**
   * 단일 사용자에게 푸시 알림 전송
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      // 사용자의 푸시 토큰 조회
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          expoPushToken: true,
          notificationEnabled: true,
          username: true
        }
      });

      if (!user?.expoPushToken) {
        console.log(`[푸시알림] 사용자 ${userId}(${user?.username})의 푸시 토큰이 없습니다.`);
        return;
      }

      if (!user.notificationEnabled) {
        console.log(`[푸시알림] 사용자 ${userId}(${user.username})가 알림을 비활성화했습니다.`);
        return;
      }

      // 푸시 토큰 유효성 검사
      if (!Expo.isExpoPushToken(user.expoPushToken)) {
        console.error(`[푸시알림] 유효하지 않은 푸시 토큰: ${user.expoPushToken}`);
        await this.removeInvalidToken(userId);
        return;
      }

      // 읽지 않은 알림 수 조회 (배지용)
      const unreadCount = await this.getUnreadNotificationCount(userId);

      // 푸시 메시지 구성 - Expo SDK 타입에 맞춰 수정
      const message: ExpoPushMessage = {
        to: user.expoPushToken,
        sound: 'default',
        title,
        body,
        data: data,
        badge: unreadCount,
        priority: 'high',
      };

      // 푸시 알림 전송
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      
      // 전송 결과 로깅
      tickets.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          console.error(`[푸시알림] 전송 실패 [${index}]:`, ticket.message);
          if (ticket.details?.error === 'DeviceNotRegistered') {
            this.removeInvalidToken(userId);
          }
        } else {
          console.log(`[푸시알림] 전송 성공: ${user.username} - ${title}`);
        }
      });

    } catch (error) {
      console.error('[푸시알림] 전송 중 오류:', error);
    }
  }

  /**
   * 여러 사용자에게 푸시 알림 전송
   */
  async sendBulkPushNotifications(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: { 
          id: { in: userIds },
          expoPushToken: { not: null },
          notificationEnabled: true
        },
        select: { 
          id: true, 
          expoPushToken: true,
          username: true
        }
      });

      if (users.length === 0) {
        console.log('[푸시알림] 유효한 푸시 토큰을 가진 사용자가 없습니다.');
        return;
      }

      // 메시지 배열 생성 - null 값을 먼저 필터링
      const validUsers = users.filter(user => 
        user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)
      );

      const messagePromises = validUsers.map(async (user) => {
        const unreadCount = await this.getUnreadNotificationCount(user.id);

        const message: ExpoPushMessage = {
          to: user.expoPushToken!,
          sound: 'default',
          title,
          body,
          data: data,
          badge: unreadCount,
          priority: 'high',
        };

        return message;
      });

      const validMessages = await Promise.all(messagePromises);

      if (validMessages.length === 0) {
        console.log('[푸시알림] 전송할 유효한 메시지가 없습니다.');
        return;
      }

      const chunks = this.expo.chunkPushNotifications(validMessages);
      
      for (const chunk of chunks) {
        try {
          const tickets = await this.expo.sendPushNotificationsAsync(chunk);
          console.log(`[푸시알림] 청크 전송 완료: ${chunk.length}개 메시지`);
        } catch (error) {
          console.error('[푸시알림] 청크 전송 실패:', error);
        }
      }

    } catch (error) {
      console.error('[푸시알림] 일괄 전송 중 오류:', error);
    }
  }

  /**
   * 읽지 않은 알림 수 조회
   */
  private async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });
    } catch (error) {
      console.error('[푸시알림] 읽지 않은 알림 수 조회 실패:', error);
      return 0;
    }
  }

  /**
   * 잘못된 토큰 제거
   */
  private async removeInvalidToken(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          expoPushToken: null,
          pushTokenUpdatedAt: null
        }
      });
      console.log(`[푸시알림] 사용자 ${userId}의 잘못된 토큰을 제거했습니다.`);
    } catch (error) {
      console.error('[푸시알림] 토큰 제거 실패:', error);
    }
  }

  /**
   * 사용자 푸시 토큰 저장/업데이트
   */
  async saveUserPushToken(userId: string, pushToken: string): Promise<void> {
    try {
      if (!Expo.isExpoPushToken(pushToken)) {
        throw new Error('유효하지 않은 푸시 토큰입니다.');
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          expoPushToken: pushToken,
          pushTokenUpdatedAt: new Date(),
          notificationEnabled: true
        }
      });

      console.log(`[푸시알림] 사용자 ${userId}의 푸시 토큰이 저장되었습니다.`);
    } catch (error) {
      console.error('[푸시알림] 토큰 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 알림 설정 업데이트
   */
  async updateNotificationSettings(
    userId: string, 
    enabled: boolean
  ): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { notificationEnabled: enabled }
      });

      console.log(`[푸시알림] 사용자 ${userId}의 알림 설정이 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('[푸시알림] 알림 설정 업데이트 실패:', error);
      throw error;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;