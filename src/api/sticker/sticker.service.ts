import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';

/**
 * 부모 프로필 ID 조회 (내부 함수)
 */
const getParentProfileId = async (userId: string): Promise<string> => {
  const parentProfile = await prisma.parentProfile.findFirst({
    where: {
      user: {
        id: userId,
      },
    },
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
        id: userId,
      },
    },
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  return childProfile.id;
};

/**
 * 부모-자녀 관계 확인 (내부 함수)
 */
const verifyParentChildRelationship = async (
  parentProfileId: string,
  childId: string,
): Promise<boolean> => {
  const connection = await prisma.childParentConnection.findFirst({
    where: {
      parentId: parentProfileId,
      childId,
    },
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
  rewardId: string | null,
) => {
  const parentProfileId = await getParentProfileId(userId);

  // 부모-자녀 관계 확인
  const hasRelationship = await verifyParentChildRelationship(
    parentProfileId,
    childId,
  );
  if (!hasRelationship) {
    throw new ApiError('이 자녀에 대한 권한이 없습니다.', 403);
  }

  // 보상 ID가 있는 경우 해당 보상 검증
  if (rewardId) {
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
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
      rewardId,
    },
  });

  // 자녀에게 알림 생성
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { userId: true },
  });

  if (childProfile) {
    await prisma.notification.create({
      data: {
        userId: childProfile.userId,
        title: '새로운 스티커를 받았어요!',
        content: `${title} 스티커를 획득했습니다! 축하합니다!`,
        notificationType: 'SYSTEM',
        relatedId: sticker.id,
      },
    });
  }

  return sticker;
};

/**
 * 자녀의 스티커 목록 조회
 */
export const getChildStickers = async (
  userId: string,
  isParent: boolean = false,
) => {
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
      childId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      reward: true,
    },
  });
};

/**
 * 특정 자녀의 스티커 목록 조회 (부모용)
 */
export const getChildStickersByParent = async (
  userId: string,
  childId: string,
) => {
  const parentProfileId = await getParentProfileId(userId);

  // 부모-자녀 관계 확인
  const hasRelationship = await verifyParentChildRelationship(
    parentProfileId,
    childId,
  );
  if (!hasRelationship) {
    throw new ApiError('이 자녀에 대한 권한이 없습니다.', 403);
  }

  return await prisma.sticker.findMany({
    where: {
      childId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      reward: true,
    },
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
              username: true,
            },
          },
        },
      },
      reward: true,
    },
  });

  if (!sticker) {
    throw new ApiError('스티커를 찾을 수 없습니다.', 404);
  }

  // 권한 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true },
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  if (user.userType === 'PARENT') {
    const parentProfileId = await getParentProfileId(userId);
    const hasRelationship = await verifyParentChildRelationship(
      parentProfileId,
      sticker.childId,
    );

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
      child: true,
    },
  });

  if (!sticker) {
    throw new ApiError('스티커를 찾을 수 없습니다.', 404);
  }

  // 부모-자녀 관계 확인
  const hasRelationship = await verifyParentChildRelationship(
    parentProfileId,
    sticker.childId,
  );
  if (!hasRelationship) {
    throw new ApiError('이 스티커를 삭제할 권한이 없습니다.', 403);
  }

  return await prisma.sticker.delete({
    where: { id: stickerId },
  });
};

/**
 * 자녀의 스티커 통계
 */
export const getChildStickerStats = async (childId: string) => {
  // 자녀 프로필 확인
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId },
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  // 사용 가능한 스티커 수 (현재 보유한 스티커는 모두 사용 가능)
  const availableStickers = await prisma.sticker.count({
    where: {
      childId,
    },
  });

  // 보상별 통계
  const rewardStats = await prisma.reward.findMany({
    where: {
      isActive: true,
      parentId: {
        in: (
          await prisma.childParentConnection.findMany({
            where: { childId },
            select: { parentId: true },
          })
        ).map((conn) => conn.parentId),
      },
    },
    select: {
      id: true,
      title: true,
      requiredStickers: true,
    },
  });

  // 각 보상에 대한 달성 가능 여부 계산
  const rewardStatsWithProgress = rewardStats.map((reward) => ({
    rewardId: reward.id,
    rewardTitle: reward.title,
    requiredStickers: reward.requiredStickers,
    progress: Math.min(
      100,
      Math.floor((availableStickers / reward.requiredStickers) * 100),
    ),
    isAchievable: availableStickers >= reward.requiredStickers,
  }));

  return {
    totalStickers: availableStickers,
    availableStickers,
    rewardStats: rewardStatsWithProgress,
  };
};

/**
 * 특정 자녀의 스티커 개수 조회
 */
export const getChildStickerCount = async (
  childId: string,
  parentId: string,
) => {
  // 부모-자녀 관계 확인
  const parentProfile = await prisma.parentProfile.findFirst({
    where: {
      user: {
        id: parentId,
      },
    },
  });

  if (!parentProfile) {
    throw new ApiError('부모 프로필을 찾을 수 없습니다.', 404);
  }

  // 연결 확인
  const connection = await prisma.childParentConnection.findFirst({
    where: {
      parentId: parentProfile.id,
      childId,
    },
  });

  if (!connection) {
    throw new ApiError('이 자녀에 대한 접근 권한이 없습니다.', 403);
  }

  // 보유 중인 스티커 개수 (모두 사용 가능)
  const availableStickers = await prisma.sticker.count({
    where: {
      childId,
    },
  });

  // 이전에 보상에 사용된 스티커 통계는 제공할 수 없음 (삭제됨)

  return {
    totalStickers: availableStickers,
    availableStickers,
  };
};

/**
 * 보상 달성 및 스티커 사용
 */
export const achieveReward = async (childId: string, rewardId: string) => {
  // 자녀 프로필 확인
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId },
  });

  const childUsername = await prisma.user.findUnique({
    where: { id: childProfile?.userId },
    select: { username: true },
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  // 보상 확인
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
  });

  if (!reward) {
    throw new ApiError('보상을 찾을 수 없습니다.', 404);
  }

  if (!reward.isActive) {
    throw new ApiError('이 보상은 현재 비활성화되어 있습니다.', 400);
  }

  // 스티커 수 확인
  const availableStickers = await prisma.sticker.count({
    where: {
      childId,
      rewardId: null, // 사용되지 않은 스티커만
    },
  });

  if (availableStickers < reward.requiredStickers) {
    throw new ApiError(
      `스티커가 부족합니다. 필요: ${reward.requiredStickers}개, 보유: ${availableStickers}개`,
      400,
    );
  }

  // 트랜잭션으로 처리
  const result = await prisma.$transaction(async (prisma) => {
    // 스티커 사용 처리 - 필요한 수만큼 스티커 가져오기
    const stickersToUse = await prisma.sticker.findMany({
      where: {
        childId,
        rewardId: null,
      },
      orderBy: {
        createdAt: 'asc', // 오래된 스티커부터 사용
      },
      take: reward.requiredStickers,
    });

    // 스티커 ID 목록
    const stickerIds = stickersToUse.map((sticker) => sticker.id);

    // 수정: 스티커 삭제 (요구사항에 따라 rewardId 설정 대신 삭제)
    await prisma.sticker.deleteMany({
      where: {
        id: {
          in: stickerIds,
        },
      },
    });

    // 부모에게 알림 생성
    // 부모 ID 찾기
    const parentConnections = await prisma.childParentConnection.findMany({
      where: { childId },
      include: {
        parent: {
          include: {
            user: true,
          },
        },
      },
    });

    
    //자녀 프로필 확인


    // 각 부모에게 알림 보내기
    for (const connection of parentConnections) {
      if (connection.parent && connection.parent.user) {
        await prisma.notification.create({
          data: {
            userId: connection.parent.user.id,
            title: '보상 달성 알림',
            content: `${
              childProfile.userId ? childUsername : '자녀'
            }가 "${reward.title}" 보상을 달성했습니다!`,
            notificationType: 'REWARD_EARNED',
            relatedId: reward.id,
            isRead: false,
          },
        });
      }
    }

    return {
      reward,
      usedStickers: stickerIds.length,
    };
  });

  return result;
};
