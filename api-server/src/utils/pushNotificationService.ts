// src/utils/pushNotificationService.ts - FCM HTTP v1 지원
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '../app';
import fcmService from './fcmService';

class PushNotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
      useFcmV1: true // FCM v1 사용 설정
    });
  }

  /**
   * 플랫폼별 토큰 유효성 검사
   */
  private isValidPushToken(token: string, platform?: string): boolean {
    if (!token) return false;
    
    if (platform === 'android') {
      // FCM 토큰 검사
      return fcmService.isValidFCMToken(token);
    } else if (platform === 'ios') {
      // Expo Push 토큰 검사
      return Expo.isExpoPushToken(token);
    } else {
      // 플랫폼 정보가 없으면 둘 다 체크
      return Expo.isExpoPushToken(token) || fcmService.isValidFCMToken(token);
    }
  }

  /**
   * 단일 사용자에게 푸시 알림 전송 (플랫폼별 처리)
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      // 사용자의 푸시 토큰 및 플랫폼 정보 조회
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          expoPushToken: true,
          fcmToken: true,
          platform: true,
          notificationEnabled: true,
          username: true
        }
      });

      if (!user?.notificationEnabled) {
        console.log(`[푸시알림] 사용자 ${userId}(${user?.username})가 알림을 비활성화했습니다.`);
        return;
      }

      // 읽지 않은 알림 수 조회 (배지용)
      const unreadCount = await this.getUnreadNotificationCount(userId);

      // 플랫폼별 푸시 알림 전송
      const pushPromises: Promise<any>[] = [];

      // 🍎 iOS - Expo Push Token
      if (user.expoPushToken && this.isValidPushToken(user.expoPushToken, 'ios')) {
        pushPromises.push(this.sendExpoPushNotification(
          user.expoPushToken,
          title,
          body,
          data,
          unreadCount
        ));
      }

      // 🤖 Android - FCM Token
      if (user.fcmToken && this.isValidPushToken(user.fcmToken, 'android')) {
        pushPromises.push(this.sendFCMPushNotification(
          user.fcmToken,
          title,
          body,
          data,
          unreadCount
        ));
      }

      // 🔄 폴백: 플랫폼 정보가 없으면 Expo 토큰으로 시도
      if (pushPromises.length === 0 && user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        pushPromises.push(this.sendExpoPushNotification(
          user.expoPushToken,
          title,
          body,
          data,
          unreadCount
        ));
      }

      if (pushPromises.length === 0) {
        console.log(`[푸시알림] 사용자 ${userId}(${user?.username})의 유효한 푸시 토큰이 없습니다.`);
        return;
      }

      // 모든 플랫폼에 동시 전송
      const results = await Promise.allSettled(pushPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`[푸시알림] 전송 성공 [${index}]: ${user.username} - ${title}`);
        } else {
          console.error(`[푸시알림] 전송 실패 [${index}]:`, result.reason);
        }
      });

    } catch (error) {
      console.error('[푸시알림] 전송 중 오류:', error);
    }
  }

  /**
   * Expo Push Notification 전송 (iOS)
   */
  private async sendExpoPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    badge?: number
  ): Promise<any> {
    const message: ExpoPushMessage = {
      to: token,
      sound: 'default',
      title,
      body,
      data: data,
      badge: badge,
      priority: 'high',
    };

    const tickets = await this.expo.sendPushNotificationsAsync([message]);
    
    tickets.forEach((ticket) => {
      if (ticket.status === 'error') {
        console.error('[Expo Push] 전송 실패:', ticket.message);
        if (ticket.details?.error === 'DeviceNotRegistered') {
          // 토큰 무효화 처리는 상위에서 처리
          throw new Error('DeviceNotRegistered');
        }
      }
    });

    return tickets[0];
  }

  /**
   * FCM HTTP v1 Push Notification 전송 (Android)
   */
  private async sendFCMPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    badge?: number
  ): Promise<any> {
    // data 객체를 문자열로 변환 (FCM 요구사항)
    const stringData: Record<string, string> = {};
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
      });
    }

    const result = await fcmService.sendPushNotificationWithAdmin({
      token,
      title,
      body,
      data: stringData,
      badge
    });

    if (!result.success) {
      throw new Error(result.error || 'FCM 전송 실패');
    }

    return result;
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
          notificationEnabled: true
        },
        select: { 
          id: true, 
          expoPushToken: true,
          fcmToken: true,
          platform: true,
          username: true
        }
      });

      if (users.length === 0) {
        console.log('[푸시알림] 유효한 사용자가 없습니다.');
        return;
      }

      // 플랫폼별로 분리
      const expoMessages: ExpoPushMessage[] = [];
      const fcmMessages: Array<{ token: string; title: string; body: string; data?: Record<string, string>; badge?: number }> = [];

      for (const user of users) {
        const unreadCount = await this.getUnreadNotificationCount(user.id);
        
        // iOS (Expo Push)
        if (user.expoPushToken && this.isValidPushToken(user.expoPushToken, 'ios')) {
          expoMessages.push({
            to: user.expoPushToken,
            sound: 'default',
            title,
            body,
            data: data,
            badge: unreadCount,
            priority: 'high',
          });
        }

        // Android (FCM)
        if (user.fcmToken && this.isValidPushToken(user.fcmToken, 'android')) {
          const stringData: Record<string, string> = {};
          if (data) {
            Object.entries(data).forEach(([key, value]) => {
              stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
            });
          }

          fcmMessages.push({
            token: user.fcmToken,
            title,
            body,
            data: stringData,
            badge: unreadCount
          });
        }
      }

      // 플랫폼별 병렬 전송
      const promises: Promise<any>[] = [];

      // Expo 메시지 전송
      if (expoMessages.length > 0) {
        promises.push(this.sendExpoMessagesInChunks(expoMessages));
      }

      // FCM 메시지 전송
      if (fcmMessages.length > 0) {
        promises.push(fcmService.sendBulkPushNotifications(fcmMessages));
      }

      await Promise.allSettled(promises);

      console.log(`[푸시알림] 일괄 전송 완료: Expo ${expoMessages.length}개, FCM ${fcmMessages.length}개`);

    } catch (error) {
      console.error('[푸시알림] 일괄 전송 중 오류:', error);
    }
  }

  /**
   * Expo 메시지를 청크 단위로 전송
   */
  private async sendExpoMessagesInChunks(messages: ExpoPushMessage[]): Promise<void> {
    const chunks = this.expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        console.log(`[Expo Push] 청크 전송 완료: ${chunk.length}개 메시지`);
      } catch (error) {
        console.error('[Expo Push] 청크 전송 실패:', error);
      }
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
  private async removeInvalidToken(userId: string, tokenType: 'expo' | 'fcm'): Promise<void> {
    try {
      const updateData: any = {};
      
      if (tokenType === 'expo') {
        updateData.expoPushToken = null;
      } else if (tokenType === 'fcm') {
        updateData.fcmToken = null;
      }
      
      updateData.pushTokenUpdatedAt = null;

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
      
      console.log(`[푸시알림] 사용자 ${userId}의 잘못된 ${tokenType} 토큰을 제거했습니다.`);
    } catch (error) {
      console.error('[푸시알림] 토큰 제거 실패:', error);
    }
  }

  /**
   * 사용자 푸시 토큰 저장/업데이트 (플랫폼별)
   */
  async saveUserPushToken(
    userId: string, 
    pushToken: string, 
    platform: 'ios' | 'android'
  ): Promise<void> {
    try {
      const updateData: any = {
        pushTokenUpdatedAt: new Date(),
        notificationEnabled: true,
        platform
      };

      if (platform === 'ios' && Expo.isExpoPushToken(pushToken)) {
        updateData.expoPushToken = pushToken;
      } else if (platform === 'android' && fcmService.isValidFCMToken(pushToken)) {
        updateData.fcmToken = pushToken;
      } else {
        throw new Error(`유효하지 않은 ${platform} 푸시 토큰입니다.`);
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      console.log(`[푸시알림] 사용자 ${userId}의 ${platform} 푸시 토큰이 저장되었습니다.`);
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