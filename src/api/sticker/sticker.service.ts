import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';

/**
 * 부모 프로필 ID 조회 (내부 함수)
 */
const getParentProfileId = async (userId: string): Promise<string> => {
  const parentProfile = await prisma.parentProfile.findFirst({
    where: {
      user: {
        id: userId
      }
    }
  });

  if (!parentProfile) {
    throw new ApiError('부모 프로필을 찾을 수 없습니다.', 404);
  }

  return parentProfile.id;
};

/**
 * 자녀 프로필 ID 조회 (내부 함수)
 */
const getChildProfileId = async (userId: string): Promise<string> => {
  const childProfile = await prisma.childProfile.findFirst({
    where: {
      user: {
        id: userId
      }
    }
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  return childProfile.id;
};

/**
 * 부모-자녀 관계 확인 (내부 함수)
 */
const verifyParentChildRelationship = async (parentProfileId: string, childId: string): Promise<boolean> => {
  const connection = await prisma.childParentConnection.findFirst({
    where: {
      parentId: parentProfileId,
      childId
    }
  });

  return !!connection;
};

/**
 * 스티커 생성 (부모 전용)
 */
export const createSticker = async (
  userId: string,
  childId: string,
  title: string,
  description: string | null,
  imageUrl: string | null,
  rewardId: string | null
) => {
  const parentProfileId = await getParentProfileId(userId);

  // 부모-자녀 관계 확인
  const hasRelationship = await verifyParentChildRelationship(parentProfileId, childId);
  if (!hasRelationship) {
    throw new ApiError('이 자녀에 대한 권한이 없습니다.', 403);
  }

  // 보상 ID가 있는 경우 해당 보상 검증
  if (rewardId) {
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    });

    if (!reward) {
      throw new ApiError('보상을 찾을 수 없습니다.', 404);
    }

    if (reward.parentId !== parentProfileId) {
      throw new ApiError('이 보상에 대한 권한이 없습니다.', 403);
    }
  }

  // 스티커 생성
  const sticker = await prisma.sticker.create({
    data: {
      childId,
      title,
      description,
      imageUrl: imageUrl || '/stickers/default-star.png', // 기본 이미지 경로
      rewardId
    }
  });

  // 자녀에게 알림 생성
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { userId: true }
  });

  if (childProfile) {
    await prisma.notification.create({
      data: {
        userId: childProfile.userId,
        title: '새로운 스티커를 받았어요!',
        content: `${title} 스티커를 획득했습니다! 축하합니다!`,
        notificationType: 'SYSTEM',
        relatedId: sticker.id
      }
    });
  }

  return sticker;
};

/**
 * 자녀의 스티커 목록 조회
 */
export const getChildStickers = async (userId: string, isParent: boolean = false) => {
  let childId: string;

  if (isParent) {
    // 부모인 경우 자녀 ID 검증 필요
    throw new ApiError('자녀 ID가 필요합니다.', 400);
  } else {
    // 자녀인 경우 자신의 ID
    childId = await getChildProfileId(userId);
  }

  return await prisma.sticker.findMany({
    where: {
      childId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      reward: true
    }
  });
};

/**
 * 특정 자녀의 스티커 목록 조회 (부모용)
 */
export const getChildStickersByParent = async (userId: string, childId: string) => {
  const parentProfileId = await getParentProfileId(userId);

  // 부모-자녀 관계 확인
  const hasRelationship = await verifyParentChildRelationship(parentProfileId, childId);
  if (!hasRelationship) {
    throw new ApiError('이 자녀에 대한 권한이 없습니다.', 403);
  }

  return await prisma.sticker.findMany({
    where: {
      childId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      reward: true
    }
  });
};

/**
 * 스티커 상세 조회
 */
export const getStickerById = async (stickerId: string, userId: string) => {
  const sticker = await prisma.sticker.findUnique({
    where: { id: stickerId },
    include: {
      child: {
        include: {
          user: {
            select: {
              username: true
            }
          }
        }
      },
      reward: true
    }
  });

  if (!sticker) {
    throw new ApiError('스티커를 찾을 수 없습니다.', 404);
  }

  // 권한 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  if (user.userType === 'PARENT') {
    const parentProfileId = await getParentProfileId(userId);
    const hasRelationship = await verifyParentChildRelationship(parentProfileId, sticker.childId);
    
    if (!hasRelationship) {
      throw new ApiError('이 스티커에 대한 권한이 없습니다.', 403);
    }
  } else if (user.userType === 'CHILD') {
    const childProfileId = await getChildProfileId(userId);
    
    if (sticker.childId !== childProfileId) {
      throw new ApiError('이 스티커에 대한 권한이 없습니다.', 403);
    }
  }

  return sticker;
};

/**
 * 스티커 삭제 (부모 전용)
 */
export const deleteSticker = async (stickerId: string, userId: string) => {
  const parentProfileId = await getParentProfileId(userId);

  const sticker = await prisma.sticker.findUnique({
    where: { id: stickerId },
    include: {
      child: true
    }
  });

  if (!sticker) {
    throw new ApiError('스티커를 찾을 수 없습니다.', 404);
  }

  // 부모-자녀 관계 확인
  const hasRelationship = await verifyParentChildRelationship(parentProfileId, sticker.childId);
  if (!hasRelationship) {
    throw new ApiError('이 스티커를 삭제할 권한이 없습니다.', 403);
  }

  return await prisma.sticker.delete({
    where: { id: stickerId }
  });
};

/**
 * 스티커 통계 (자녀용)
 */
export const getChildStickerStats = async (userId: string) => {
  const childProfileId = await getChildProfileId(userId);

  // 전체 스티커 수
  const totalStickers = await prisma.sticker.count({
    where: {
      childId: childProfileId
    }
  });

  // 보상 별 스티커 분류
  const stickersByReward = await prisma.sticker.groupBy({
    by: ['rewardId'],
    where: {
      childId: childProfileId
    },
    _count: {
      id: true
    }
  });

  // 보상 정보 조회
  const rewards = await prisma.reward.findMany({
    where: {
      stickers: {
        some: {
          childId: childProfileId
        }
      }
    }
  });

  // 응답 형식 구성
  const rewardStats = stickersByReward.map(item => {
    const reward = rewards.find(r => r.id === item.rewardId);
    return {
      rewardId: item.rewardId,
      rewardTitle: reward?.title || '미분류',
      count: item._count.id,
      requiredStickers: reward?.requiredStickers || 0,
      progress: reward ? (item._count.id / reward.requiredStickers) * 100 : 0
    };
  });

  return {
    totalStickers,
    rewardStats
  };
};