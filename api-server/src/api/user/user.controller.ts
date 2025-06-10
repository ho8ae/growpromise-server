import { prisma } from '../../app';
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as userService from './user.service';
import pushNotificationService from '../../utils/pushNotificationService';

// import { uploadFileToS3 } from '../../middleware/upload.middleware';

/**
 * 프로필 정보 조회
 * @route GET /api/users/profile
 */
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const profile = await userService.getUserProfile(req.user.id);
  
  res.status(200).json({
    success: true,
    data: profile
  });
});

/**
 * 상세 프로필 정보 조회 (소셜 로그인 정보 포함)
 * @route GET /api/users/profile/detail
 */
export const getUserDetailProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const profile = await userService.getUserDetailProfile(req.user.id);
  
  res.status(200).json({
    success: true,
    message: '상세 프로필 정보를 조회했습니다.',
    data: profile
  });
});

/**
 * 프로필 정보 업데이트
 * @route PATCH /api/users/profile
 */
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { username, email, birthDate } = req.body;
  
  const updateData: any = {};
  
  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
  
  const updatedProfile = await userService.updateUserProfile(req.user.id, updateData);
  
  res.status(200).json({
    success: true,
    message: '프로필이 성공적으로 업데이트되었습니다.',
    data: updatedProfile
  });
});

/**
 * 확장된 프로필 정보 업데이트
 * @route PATCH /api/users/profile/detail
 */
export const updateUserDetailProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { username, email, phoneNumber, bio, birthDate } = req.body;
  
  const updateData: any = {};
  
  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (bio !== undefined) updateData.bio = bio;
  if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
  
  const updatedProfile = await userService.updateUserDetailProfile(req.user.id, updateData);
  
  res.status(200).json({
    success: true,
    message: '프로필이 성공적으로 업데이트되었습니다.',
    data: updatedProfile
  });
});

/**
 * 사용 가능한 아바타 목록 조회
 * @route GET /api/users/profile/avatars
 */
export const getAvailableAvatars = asyncHandler(async (req: Request, res: Response) => {
  const avatars = [
    { id: 'avatar1', url: 'https://growpromise-uploads.s3.ap-northeast-2.amazonaws.com/plant/level_1.png', name: '기본 아바타 1' },
    { id: 'avatar2', url: 'https://growpromise-uploads.s3.ap-northeast-2.amazonaws.com/plant/level_2.png', name: '기본 아바타 2' },
    { id: 'avatar3', url: 'https://growpromise-uploads.s3.ap-northeast-2.amazonaws.com/plant/level_3.png', name: '기본 아바타 3' },
  
  ];
  
  res.status(200).json({
    success: true,
    message: '사용 가능한 아바타 목록을 조회했습니다.',
    data: avatars
  });
});

/**
 * 기본 프로필 이미지 선택 (미리 정의된 이미지 중 선택)
 * @route PATCH /api/users/profile/avatar
 */
export const selectProfileAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { avatarId } = req.body;
  
  if (!avatarId) {
    return res.status(400).json({
      success: false,
      message: '아바타 ID가 필요합니다.'
    });
  }
  
  // 미리 정의된 아바타 목록
  const avatars = {
    'avatar1': 'https://your-cdn.com/avatars/avatar1.png',
    'avatar2': 'https://your-cdn.com/avatars/avatar2.png',
    'avatar3': 'https://your-cdn.com/avatars/avatar3.png',
    'avatar4': 'https://your-cdn.com/avatars/avatar4.png',
    'avatar5': 'https://your-cdn.com/avatars/avatar5.png',
    'boy1': 'https://your-cdn.com/avatars/boy1.png',
    'boy2': 'https://your-cdn.com/avatars/boy2.png',
    'girl1': 'https://your-cdn.com/avatars/girl1.png',
    'girl2': 'https://your-cdn.com/avatars/girl2.png',
    'parent1': 'https://your-cdn.com/avatars/parent1.png',
    'parent2': 'https://your-cdn.com/avatars/parent2.png',
  };
  
  const selectedAvatarUrl = avatars[avatarId as keyof typeof avatars];
  
  if (!selectedAvatarUrl) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 아바타 ID입니다.'
    });
  }
  
  const updatedProfile = await userService.updateProfileImage(req.user.id, selectedAvatarUrl);
  
  res.status(200).json({
    success: true,
    message: '프로필 아바타가 성공적으로 변경되었습니다.',
    data: updatedProfile
  });
});

/**
 * 자녀 목록 조회 (부모용)
 * @route GET /api/users/children
 */
export const getParentChildren = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const children = await userService.getParentChildren(req.user.id);
  
  res.status(200).json({
    success: true,
    data: children
  });
});

/**
 * 부모 목록 조회 (자녀용)
 * @route GET /api/users/parents
 */
export const getChildParents = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const parents = await userService.getChildParents(req.user.id);
  
  res.status(200).json({
    success: true,
    data: parents
  });
});

/**
 * 사용자 상세 정보 조회
 * @route GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  const user = await userService.getUserById(id, req.user.id);
  
  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * 사용자 계정 상태 조회
 * @route GET /api/users/account-status
 */
export const getUserAccountStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  const status = await userService.getUserAccountStatus(req.user.id);
  
  res.status(200).json({
    success: true,
    message: '계정 상태 정보를 조회했습니다.',
    data: status
  });
});



/**
 * 푸시 토큰 저장/업데이트 (플랫폼별 지원)
 * @route POST /api/users/push-token
 */
export const updatePushToken = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  const { expoPushToken, fcmToken, platform } = req.body;

  // 플랫폼별 토큰 유효성 검사
  if (!platform || !['ios', 'android'].includes(platform)) {
    return res.status(400).json({
      success: false,
      message: '플랫폼 정보가 필요합니다. (ios 또는 android)'
    });
  }

  if (platform === 'ios' && !expoPushToken) {
    return res.status(400).json({
      success: false,
      message: 'iOS에서는 Expo 푸시 토큰이 필요합니다.'
    });
  }

  if (platform === 'android' && !fcmToken && !expoPushToken) {
    return res.status(400).json({
      success: false,
      message: 'Android에서는 FCM 토큰 또는 Expo 토큰이 필요합니다.'
    });
  }

  try {
    // 플랫폼별 토큰 저장
    if (platform === 'ios' && expoPushToken) {
      await pushNotificationService.saveUserPushToken(req.user.id, expoPushToken, 'ios');
    } else if (platform === 'android') {
      // Android는 FCM 토큰 우선, 없으면 Expo 토큰 사용
      const token = fcmToken || expoPushToken;
      await pushNotificationService.saveUserPushToken(req.user.id, token, 'android');
    }

    res.status(200).json({
      success: true,
      message: `${platform.toUpperCase()} 푸시 토큰이 성공적으로 저장되었습니다.`
    });
  } catch (error) {
    console.error('푸시 토큰 저장 오류:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : '푸시 토큰 저장에 실패했습니다.'
    });
  }
});


/**
 * 알림 설정 업데이트
 * @route PATCH /api/users/notification-settings
 */
export const updateNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: '알림 설정 값이 유효하지 않습니다.'
    });
  }

  try {
    await pushNotificationService.updateNotificationSettings(req.user.id, enabled);

    res.status(200).json({
      success: true,
      message: `알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`
    });
  } catch (error) {
    console.error('알림 설정 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 설정 업데이트에 실패했습니다.'
    });
  }
});

/**
 * 테스트 푸시 알림 전송
 * @route POST /api/users/test-push
 */
export const sendTestPushNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  try {
    await pushNotificationService.sendPushNotification(
      req.user.id,
      '테스트 알림 🎯',
      '푸시 알림이 정상적으로 작동합니다!',
      { test: true, timestamp: new Date().toISOString() }
    );

    res.status(200).json({
      success: true,
      message: '테스트 푸시 알림이 전송되었습니다.'
    });
  } catch (error) {
    console.error('테스트 푸시 알림 전송 오류:', error);
    res.status(500).json({
      success: false,
      message: '테스트 푸시 알림 전송에 실패했습니다.'
    });
  }
});

/**
 * 사용자 알림 설정 조회 (플랫폼별 토큰 정보 포함)
 * @route GET /api/users/notification-settings
 */
export const getNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        expoPushToken: true,
        fcmToken: true,
        platform: true,
        notificationEnabled: true,
        pushTokenUpdatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        hasToken: !!(user.expoPushToken || user.fcmToken),
        hasExpoToken: !!user.expoPushToken,
        hasFcmToken: !!user.fcmToken,
        platform: user.platform,
        isEnabled: user.notificationEnabled,
        lastUpdated: user.pushTokenUpdatedAt
      }
    });
  } catch (error) {
    console.error('알림 설정 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 설정 조회에 실패했습니다.'
    });
  }
});


/**
 * 레거시 푸시 토큰 업데이트 (하위 호환성)
 * @route POST /api/users/push-token/legacy
 */
export const updatePushTokenLegacy = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  const { expoPushToken } = req.body;

  if (!expoPushToken) {
    return res.status(400).json({
      success: false,
      message: '푸시 토큰이 필요합니다.'
    });
  }

  try {
    // 레거시 호환성을 위해 iOS로 가정
    await pushNotificationService.saveUserPushToken(req.user.id, expoPushToken, 'ios');

    res.status(200).json({
      success: true,
      message: '푸시 토큰이 성공적으로 저장되었습니다.'
    });
  } catch (error) {
    console.error('레거시 푸시 토큰 저장 오류:', error);
    res.status(400).json({
      success: false,
      message: '유효하지 않은 푸시 토큰입니다.'
    });
  }
});

/* 
// S3 이미지 업로드 기능 (나중에 필요할 때 주석 해제)
export const updateProfileImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: '프로필 이미지가 필요합니다.'
    });
  }
  
  try {
    // S3에 업로드
    const imageUrl = await uploadFileToS3(req.file, 'profile-images');
    
    // DB 업데이트
    const updatedProfile = await userService.updateProfileImage(req.user.id, imageUrl);
    
    res.status(200).json({
      success: true,
      message: '프로필 이미지가 성공적으로 업데이트되었습니다.',
      data: updatedProfile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '이미지 업로드에 실패했습니다.'
    });
  }
});
*/