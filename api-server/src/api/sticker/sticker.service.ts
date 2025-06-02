import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';

/**
 * 사용 가능한 모든 스티커 템플릿 조회
 */
export const getAllStickerTemplates = async () => {
  // 미리 정의된 스티커 템플릿 조회
  return await prisma.stickerTemplate.findMany({
    orderBy: {
      category: 'asc'
    }
  });
};

/**
 * 카테고리별 스티커 템플릿 조회
 */
export const getStickerTemplatesByCategory = async (category: string) => {
  return await prisma.stickerTemplate.findMany({
    where: {
      category
    },
    orderBy: {
      name: 'asc'
    }
  });
};

/**
 * 스티커 생성 (부모용) - 기존 템플릿 사용
 */
export const createSticker = async (
  parentUserId: string,
  childId: string,
  title: string,
  templateId: string, // 스티커 템플릿 ID
  description?: string | null
) => {
  // 부모 프로필 확인
  const parentProfile = await prisma.parentProfile.findFirst({
    where: {
      user: {
        id: parentUserId
      }
    }
  });

  if (!parentProfile) {
    throw new ApiError('부모 프로필을 찾을 수 없습니다.', 404);
  }

  // 자녀-부모 관계 확인
  const connection = await prisma.childParentConnection.findFirst({
    where: {
      childId,
      parentId: parentProfile.id
    }
  });

  if (!connection) {
    throw new ApiError('연결된 자녀가 아닙니다.', 403);
  }

  // 스티커 템플릿 확인
  const template = await prisma.stickerTemplate.findUnique({
    where: {
      id: templateId
    }
  });

  if (!template) {
    throw new ApiError('스티커 템플릿을 찾을 수 없습니다.', 404);
  }

  // 스티커 생성
  const sticker = await prisma.sticker.create({
    data: {
      childId,
      title,
      description: description || null,
      imageUrl: template.imageUrl, // 템플릿의 이미지 URL 사용
      createdAt: new Date()
    }
  });

  // 자녀에게 알림 생성
  try {
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childId },
      include: {
        user: true
      }
    });

    if (childProfile && childProfile.user) {
      await prisma.notification.create({
        data: {
          userId: childProfile.user.id,
          title: '새로운 스티커를 받았어요!',
          content: `"${title}" 스티커를 받았어요. 확인해보세요!`,
          notificationType: 'SYSTEM',
          relatedId: sticker.id,
          isRead: false
        }
      });
    }
  } catch (error) {
    console.error('알림 생성 실패:', error);
  }

  return sticker;
};

/**
 * 자녀의 스티커 목록 조회 (부모용)
 */
export const getChildStickers = async (childId: string) => {
  return await prisma.sticker.findMany({
    where: {
      childId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

/**
 * 스티커 삭제
 */
export const deleteSticker = async (stickerId: string, parentUserId: string) => {
  // 부모 프로필 확인
  const parentProfile = await prisma.parentProfile.findFirst({
    where: {
      user: {
        id: parentUserId
      }
    }
  });

  if (!parentProfile) {
    throw new ApiError('부모 프로필을 찾을 수 없습니다.', 404);
  }

  // 스티커 조회
  const sticker = await prisma.sticker.findUnique({
    where: {
      id: stickerId
    },
    include: {
      child: true
    }
  });

  if (!sticker) {
    throw new ApiError('스티커를 찾을 수 없습니다.', 404);
  }

  // 자녀-부모 관계 확인
  const connection = await prisma.childParentConnection.findFirst({
    where: {
      childId: sticker.childId,
      parentId: parentProfile.id
    }
  });

  if (!connection) {
    throw new ApiError('해당 스티커를 삭제할 권한이 없습니다.', 403);
  }

  // 스티커 삭제
  await prisma.sticker.delete({
    where: {
      id: stickerId
    }
  });

  return { success: true };
};

/**
 * 자녀의 스티커 개수 조회
 */
export const getChildStickerCount = async (childId: string) => {
  // 총 스티커 수
  const totalStickers = await prisma.sticker.count({
    where: {
      childId
    }
  });
  
  // 사용 가능한 스티커 수 (보상에 사용되지 않은 스티커)
  const availableStickers = await prisma.sticker.count({
    where: {
      childId,
      rewardId: null
    }
  });
  
  return {
    totalStickers,
    availableStickers
  };
};

/**
 * 자신의 스티커 목록 조회 (자녀용)
 */
export const getChildStickersByUserId = async (userId: string) => {
  // 자녀 프로필 확인
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

  // 스티커 목록 조회
  return await prisma.sticker.findMany({
    where: {
      childId: childProfile.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

/**
 * 스티커 통계 조회 (자녀용)
 */
/**
 * 스티커 통계 조회 (자녀용)
 */
export const getChildStickerStats = async (userId: string) => {
  // 자녀 프로필 확인
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

  // 총 스티커 수
  const totalStickers = await prisma.sticker.count({
    where: {
      childId: childProfile.id
    }
  });

  // 사용 가능한 스티커 수 (보상에 사용되지 않은 스티커)
  const availableStickers = await prisma.sticker.count({
    where: {
      childId: childProfile.id,
      rewardId: null
    }
  });

  // 월별 스티커 통계
  const monthlyStats = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as count
    FROM "Sticker"
    WHERE "childId" = ${childProfile.id}
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month DESC
    LIMIT 6
  `;

  // 보상 사용 이력
  const rewardHistory = await prisma.rewardHistory.findMany({
    where: {
      childId: childProfile.id
    },
    include: {
      reward: true
    },
    orderBy: {
      achievedAt: 'desc'
    },
    take: 10 // 최근 10개만
  });

  return {
    totalStickers,
    availableStickers,
    monthlyStats,
    rewardHistory
  };
};

/**
 * 스티커 상세 조회
 */
export const getStickerById = async (stickerId: string, userId: string) => {
  // 사용자 정보 확인
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 스티커 조회
  const sticker = await prisma.sticker.findUnique({
    where: {
      id: stickerId
    }
  });

  if (!sticker) {
    throw new ApiError('스티커를 찾을 수 없습니다.', 404);
  }

  // 부모인 경우 자녀와의 관계 확인
  if (user.userType === 'PARENT') {
    const parentProfile = await prisma.parentProfile.findFirst({
      where: {
        userId: user.id
      }
    });

    if (!parentProfile) {
      throw new ApiError('부모 프로필을 찾을 수 없습니다.', 404);
    }

    const connection = await prisma.childParentConnection.findFirst({
      where: {
        childId: sticker.childId,
        parentId: parentProfile.id
      }
    });

    if (!connection) {
      throw new ApiError('해당 스티커에 접근할 권한이 없습니다.', 403);
    }
  }
  // 자녀인 경우 본인 스티커인지 확인
  else if (user.userType === 'CHILD') {
    const childProfile = await prisma.childProfile.findFirst({
      where: {
        userId: user.id
      }
    });

    if (!childProfile) {
      throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
    }

    if (sticker.childId !== childProfile.id) {
      throw new ApiError('해당 스티커에 접근할 권한이 없습니다.', 403);
    }
  }

  return sticker;
};