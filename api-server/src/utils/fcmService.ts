// src/utils/fcmService.ts - FCM HTTP v1 API 서비스
import { GoogleAuth } from 'google-auth-library';
import * as admin from 'firebase-admin';

interface FCMMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
}

interface FCMResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class FCMService {
  private auth: GoogleAuth;
  private projectId: string;
  private isInitialized: boolean = false;

  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || 'growpromise-dfd54';
    
    // Service Account 경로 설정
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
    
    this.auth = new GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    });

    this.initializeFirebaseAdmin();
  }

  /**
   * Firebase Admin SDK 초기화
   */
  private initializeFirebaseAdmin() {
    try {
      if (!admin.apps.length) {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
        const serviceAccount = require(serviceAccountPath);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: this.projectId
        });

        console.log('✅ Firebase Admin SDK 초기화 완료');
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Firebase Admin SDK 초기화 실패:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 액세스 토큰 가져오기
   */
  private async getAccessToken(): Promise<string> {
    try {
      const accessToken = await this.auth.getAccessToken();
      return accessToken || '';
    } catch (error) {
      console.error('액세스 토큰 가져오기 실패:', error);
      throw new Error('FCM 인증 실패');
    }
  }

  /**
   * FCM HTTP v1 API로 단일 푸시 알림 전송
   */
  async sendPushNotification(message: FCMMessage): Promise<FCMResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      const fcmMessage = {
        message: {
          token: message.token,
          notification: {
            title: message.title,
            body: message.body
          },
          data: message.data || {},
          android: {
            priority: 'high' as const,
            notification: {
              channel_id: 'default',
              sound: 'default',
              color: '#58CC02',
              ...(message.badge && { badge: message.badge.toString() })
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                ...(message.badge && { badge: message.badge }),
                alert: {
                  title: message.title,
                  body: message.body
                }
              }
            }
          }
        }
      };

      const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fcmMessage)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ FCM 푸시 알림 전송 성공:', result.name);
        
        return {
          success: true,
          messageId: result.name
        };
      } else {
        const errorData = await response.text();
        console.error('❌ FCM 푸시 알림 전송 실패:', errorData);
        
        return {
          success: false,
          error: errorData
        };
      }
    } catch (error) {
      console.error('FCM 전송 중 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * Firebase Admin SDK를 사용한 푸시 알림 전송 (대안)
   */
  async sendPushNotificationWithAdmin(message: FCMMessage): Promise<FCMResponse> {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase Admin SDK가 초기화되지 않았습니다.');
      }

      const adminMessage: admin.messaging.Message = {
        token: message.token,
        notification: {
          title: message.title,
          body: message.body
        },
        data: message.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
            color: '#58CC02'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: message.badge || 0
            }
          }
        }
      };

      const messageId = await admin.messaging().send(adminMessage);
      
      console.log('✅ Firebase Admin SDK 푸시 알림 전송 성공:', messageId);
      
      return {
        success: true,
        messageId
      };
    } catch (error) {
      console.error('❌ Firebase Admin SDK 푸시 알림 전송 실패:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 여러 기기에 일괄 전송
   */
  async sendBulkPushNotifications(messages: FCMMessage[]): Promise<FCMResponse[]> {
    const results: FCMResponse[] = [];
    
    // 동시 전송 제한 (FCM 할당량 고려)
    const batchSize = 500;
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(msg => this.sendPushNotificationWithAdmin(msg));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        console.log(`FCM 일괄 전송 배치 ${Math.floor(i / batchSize) + 1} 완료: ${batch.length}개`);
      } catch (error) {
        console.error(`FCM 일괄 전송 배치 ${Math.floor(i / batchSize) + 1} 실패:`, error);
        
        // 실패한 배치에 대해 개별 처리
        for (const msg of batch) {
          results.push({
            success: false,
            error: '일괄 전송 실패'
          });
        }
      }
    }
    
    return results;
  }

  /**
   * 토큰 유효성 검사
   */
  isValidFCMToken(token: string): boolean {
    // FCM 토큰은 보통 152자 이상의 문자열
    return typeof token === 'string' && token.length > 50;
  }

  /**
   * 토픽에 메시지 전송
   */
  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>): Promise<FCMResponse> {
    try {
      if (!this.isInitialized) {
        throw new Error('Firebase Admin SDK가 초기화되지 않았습니다.');
      }

      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
            color: '#58CC02'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      const messageId = await admin.messaging().send(message);
      
      console.log(`✅ 토픽 "${topic}"에 푸시 알림 전송 성공:`, messageId);
      
      return {
        success: true,
        messageId
      };
    } catch (error) {
      console.error(`❌ 토픽 "${topic}" 푸시 알림 전송 실패:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }
}

export const fcmService = new FCMService();
export default fcmService;