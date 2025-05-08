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
 * 보상 생성 (부모 전용)
 */
export const createReward = async (
  userId: string,
  title: string,
  description: string | null,
  requiredStickers: number,
  isActive: boolean = true
) => {
  const parentProfileId = await getParentProfileId(userId);

  return await prisma.reward.create({
    data: {
      parentId: parentProfileId,
      title,
      description,
      requiredStickers,
      isActive
    }
  });
};

/**
 * 부모의 보상 목록 조회
 */
export const getParentRewards = async (userId: string) => {
  const parentProfileId = await getParentProfileId(userId);

  return await prisma.reward.findMany({
    where: {
      parentId: parentProfileId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

/**
 * 자녀의 보상 목록 조회
 */
export const getChildRewards = async (userId: string) => {
  const childProfileId = await getChildProfileId(userId);

  // 연결된 부모 조회
  const connections = await prisma.childParentConnection.findMany({
    where: {
      childId: childProfileId
    },
    select: {
      parentId: true
    }
  });

  const parentIds = connections.map(conn => conn.parentId);

  // 부모들의 활성화된 보상 조회
  const rewards = await prisma.reward.findMany({
    where: {
      parentId: {
        in: parentIds
      },
      isActive: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // 각 보상에 대한 자녀의 스티커 수 계산
  const rewardsWithProgress = await Promise.all(
    rewards.map(async (reward) => {
      const stickersCount = await prisma.sticker.count({
        where: {
          childId: childProfileId,
          rewardId: null // 아직 보상에 사용되지 않은 스티커만 계산
        }
      });

      return {
        ...reward,
        availableStickers: stickersCount,
        progress: (stickersCount / reward.requiredStickers) * 100
      };
    })
  );

  return rewardsWithProgress;
};

/**
 * 보상 상세 조회
 */
export const getRewardById = async (rewardId: string, userId: string) => {
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
    include: {
      parent: {
        include: {
          user: {
            select: {
              username: true
            }
          }
        }
      },
      stickers: {
        include: {
          child: {
            include: {
              user: {
                select: {
                  username: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!reward) {
    throw new ApiError('보상을 찾을 수 없습니다.', 404);
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
    if (reward.parentId !== parentProfileId) {
      throw new ApiError('이 보상에 대한 접근 권한이 없습니다.', 403);
    }
  } else if (user.userType === 'CHILD') {
    const childProfileId = await getChildProfileId(userId);
    
    // 자녀의 부모가 생성한 보상인지 확인
    const connections = await prisma.childParentConnection.findMany({
      where: {
        childId: childProfileId
      },
      select: {
        parentId: true
      }
    });
    
    const parentIds = connections.map(conn => conn.parentId);
    
    if (!parentIds.includes(reward.parentId)) {
      throw new ApiError('이 보상에 대한 접근 권한이 없습니다.', 403);
    }
  }

  return reward;
};

/**
 * 보상 업데이트 (부모 전용)
 */
export const updateReward = async (
  rewardId: string,
  userId: string,
  updateData: {
    title?: string;
    description?: string | null;
    requiredStickers?: number;
    isActive?: boolean;
  }
) => {
  const parentProfileId = await getParentProfileId(userId);

  // 보상 존재 및 소유 확인
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId }
  });

  if (!reward) {
    throw new ApiError('보상을 찾을 수 없습니다.', 404);
  }

  if (reward.parentId !== parentProfileId) {
    throw new ApiError('이 보상을 수정할 권한이 없습니다.', 403);
  }

  // 보상 업데이트
  return await prisma.reward.update({
    where: { id: rewardId },
    data: {
      title: updateData.title || undefined,
      description: 'description' in updateData ? updateData.description : undefined,
      requiredStickers: updateData.requiredStickers || undefined,
      isActive: 'isActive' in updateData ? updateData.isActive : undefined
    }
  });
};

/**
 * 보상 삭제 (부모 전용)
 */
export const deleteReward = async (rewardId: string, userId: string) => {
  const parentProfileId = await getParentProfileId(userId);

  // 보상 존재 및 소유 확인
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId }
  });

  if (!reward) {
    throw new ApiError('보상을 찾을 수 없습니다.', 404);
  }

  if (reward.parentId !== parentProfileId) {
    throw new ApiError('이 보상을 삭제할 권한이 없습니다.', 403);
  }

  // 관련 스티커 확인
  const stickersCount = await prisma.sticker.count({
    where: {
      rewardId
    }
  });

  if (stickersCount > 0) {
    throw new ApiError('이 보상에 연결된 스티커가 있습니다. 삭제할 수 없습니다.', 400);
  }

  // 보상 삭제
  return await prisma.reward.delete({
    where: { id: rewardId }
  });
};

/**
 * 보상 달성 (자녀 전용)
 */
export const achieveReward = async (rewardId: string, userId: string) => {
  const childProfileId = await getChildProfileId(userId);

  // 보상 존재 확인
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId }
  });

  if (!reward) {
    throw new ApiError('보상을 찾을 수 없습니다.', 404);
  }

  // 보상이 활성화되어 있는지 확인
  if (!reward.isActive) {
    throw new ApiError('이 보상은 현재 비활성화 상태입니다.', 400);
  }

  // 자녀의 부모가 생성한 보상인지 확인
  const connections = await prisma.childParentConnection.findMany({
    where: {
      childId: childProfileId
    },
    select: {
      parentId: true
    }
  });
  
  const parentIds = connections.map(conn => conn.parentId);
  
  if (!parentIds.includes(reward.parentId)) {
    throw new ApiError('이 보상에 대한 접근 권한이 없습니다.', 403);
  }

  // 자녀의 스티커 수 확인
  const availableStickers = await prisma.sticker.findMany({
    where: {
      childId: childProfileId,
      rewardId: null // 보상에 사용되지 않은 스티커만
    },
    orderBy: {
      createdAt: 'asc' // 가장 오래된 스티커부터 사용
    }
  });

  if (availableStickers.length < reward.requiredStickers) {
    throw new ApiError(
      `스티커가 부족합니다. 필요: ${reward.requiredStickers}개, 보유: ${availableStickers.length}개`,
      400
    );
  }

  // 트랜잭션으로 보상 달성 처리
  return await prisma.$transaction(async (prisma) => {
    // 필요한 수의 스티커를 보상에 연결
    const stickersToUse = availableStickers.slice(0, reward.requiredStickers);
    
    for (const sticker of stickersToUse) {
      await prisma.sticker.update({
        where: { id: sticker.id },
        data: { rewardId }
      });
    }

    // 부모에게 알림 생성
    await prisma.notification.create({
      data: {
        userId: await getUserIdFromParentProfileId(prisma, reward.parentId),
        title: '보상 달성 알림',
        content: `자녀가 "${reward.title}" 보상을 달성했습니다.`,
        notificationType: 'REWARD_EARNED',
        relatedId: rewardId
      }
    });

    return {
      reward,
      usedStickers: stickersToUse.length
    };
  });
};

/**
 * 부모 프로필 ID로 사용자 ID 조회 (내부 함수)
 */
const getUserIdFromParentProfileId = async (prisma: any, parentProfileId: string): Promise<string> => {
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { id: parentProfileId },
    select: { userId: true }
  });

  if (!parentProfile) {
    throw new ApiError('부모 프로필을 찾을 수 없습니다.', 404);
  }

  return parentProfile.userId;
};