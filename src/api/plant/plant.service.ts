import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';

/**
 * 모든 식물 유형 조회
 */
export const getAllPlantTypes = async (childId?: string) => {
  // 기본 쿼리
  const baseQuery = {
    orderBy: { unlockRequirement: 'asc' as const }
  };

  // 자녀 ID가 있으면 해당 자녀가 잠금 해제한 식물만 필터링
  if (childId) {
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childId }
    });

    if (!childProfile) {
      throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
    }

    // 자녀가 잠금 해제한 식물 유형 필터링
    return prisma.plantType.findMany({
      where: {
        OR: [
          { unlockRequirement: null }, // 기본적으로 잠금 해제된 식물
          { unlockRequirement: { lte: childProfile.totalCompletedPlants } } // 조건을 충족하는 식물
        ]
      },
      ...baseQuery
    });
  }

  // 모든 식물 유형 반환
  return prisma.plantType.findMany(baseQuery);
};

/**
 * 식물 유형 상세 조회
 */
export const getPlantTypeById = async (plantTypeId: string) => {
  const plantType = await prisma.plantType.findUnique({
    where: { id: plantTypeId }
  });

  if (!plantType) {
    throw new ApiError('식물 유형을 찾을 수 없습니다.', 404);
  }

  return plantType;
};

/**
 * 자녀의 현재 식물 조회
 */
export const getCurrentPlant = async (childId: string) => {
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId },
    include: {
      plants: {
        where: {
          isCompleted: false
        },
        include: {
          plantType: true
        },
        orderBy: {
          startedAt: 'desc'
        },
        take: 1
      }
    }
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  if (childProfile.plants.length === 0) {
    return null; // 현재 키우고 있는 식물이 없음
  }

  return childProfile.plants[0];
};

/**
 * 자녀의 모든 식물 조회
 */
export const getChildPlants = async (childId: string) => {
  // 자녀 프로필 확인
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId }
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  // 자녀의 모든 식물 조회
  return prisma.plant.findMany({
    where: { childId },
    include: {
      plantType: true
    },
    orderBy: [
      { isCompleted: 'asc' as const },
      { startedAt: 'desc' as const }
    ]
  });
};

/**
 * 새 식물 시작하기
 */
export const startNewPlant = async (childId: string, plantTypeId: string, plantName?: string) => {
  // 자녀 프로필 확인
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId }
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  // 식물 유형 확인
  const plantType = await prisma.plantType.findUnique({
    where: { id: plantTypeId }
  });

  if (!plantType) {
    throw new ApiError('식물 유형을 찾을 수 없습니다.', 404);
  }

  // 식물 유형 잠금 해제 여부 확인
  if (plantType.unlockRequirement !== null && 
      plantType.unlockRequirement > childProfile.totalCompletedPlants) {
    throw new ApiError('이 식물은 아직 잠금 해제되지 않았습니다.', 403);
  }

  // 현재 진행 중인 식물이 있는지 확인
  const currentPlant = await prisma.plant.findFirst({
    where: {
      childId,
      isCompleted: false
    }
  });

  if (currentPlant) {
    throw new ApiError('이미 진행 중인 식물이 있습니다. 새 식물을 시작하려면 현재 식물을 완료하세요.', 400);
  }

  // 새 식물 생성
  const newPlant = await prisma.plant.create({
    data: {
      childId,
      plantTypeId,
      name: plantName || null,
      currentStage: 1,
      health: 100,
      lastWatered: new Date(),
      isCompleted: false,
      startedAt: new Date()
    }
  });

  // 자녀 프로필 업데이트 (현재 식물 ID)
  await prisma.childProfile.update({
    where: { id: childId },
    data: {
      currentPlantId: newPlant.id
    }
  });

  return newPlant;
};

/**
 * 식물에 물주기
 */
export const waterPlant = async (plantId: string) => {
  // 식물 조회
  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    include: {
      plantType: true
    }
  });

  if (!plant) {
    throw new ApiError('식물을 찾을 수 없습니다.', 404);
  }

  if (plant.isCompleted) {
    throw new ApiError('이미 완료된 식물입니다.', 400);
  }

  // 마지막 물주기 시간 확인 (하루에 한 번만 가능)
  const lastWatered = new Date(plant.lastWatered);
  const today = new Date();
  
  if (lastWatered.toDateString() === today.toDateString()) {
    throw new ApiError('오늘 이미 물을 주었습니다. 내일 다시 시도하세요.', 400);
  }

  // 물주기로 인한 건강 회복량
  const healthGain = Math.min(10, 100 - plant.health);
  
  // 연속 물주기 체크
  const oneDayAgo = new Date(today);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  let wateringStreak = 0;
  
  // 자녀 프로필 조회
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: plant.childId }
  });
  
  if (childProfile) {
    // 어제 물을 줬으면 연속 물주기 증가
    if (lastWatered.toDateString() === oneDayAgo.toDateString()) {
      wateringStreak = childProfile.wateringStreak + 1;
    } else {
      wateringStreak = 1; // 연속이 깨짐
    }
  }

  // 트랜잭션으로 물주기 처리
  const result = await prisma.$transaction(async (prisma) => {
    // 물주기 로그 생성
    const wateringLog = await prisma.wateringLog.create({
      data: {
        plantId: plant.id,
        timestamp: today,
        healthGain
      }
    });

    // 식물 업데이트
    const updatedPlant = await prisma.plant.update({
      where: { id: plant.id },
      data: {
        health: plant.health + healthGain,
        lastWatered: today,
      }
    });

    // 자녀 프로필 연속 물주기 업데이트
    if (childProfile) {
      await prisma.childProfile.update({
        where: { id: plant.childId },
        data: {
          wateringStreak
        }
      });
    }

    return {
      wateringLog,
      updatedPlant,
      wateringStreak
    };
  });

  return result;
};

/**
 * 식물 성장 단계 올리기
 */
export const advancePlantStage = async (plantId: string) => {
  // 식물 조회
  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    include: {
      plantType: true
    }
  });

  if (!plant) {
    throw new ApiError('식물을 찾을 수 없습니다.', 404);
  }

  if (plant.isCompleted) {
    throw new ApiError('이미 완료된 식물입니다.', 400);
  }

  // 최대 성장 단계 확인
  if (plant.currentStage >= plant.plantType.growthStages) {
    // 완료 처리
    const completedPlant = await prisma.$transaction(async (prisma) => {
      // 식물 완료 처리
      const updatedPlant = await prisma.plant.update({
        where: { id: plant.id },
        data: {
          isCompleted: true,
          completedAt: new Date()
        }
      });

      // 자녀 프로필 업데이트
      const childProfile = await prisma.childProfile.findUnique({
        where: { id: plant.childId }
      });

      if (childProfile) {
        await prisma.childProfile.update({
          where: { id: plant.childId },
          data: {
            totalCompletedPlants: childProfile.totalCompletedPlants + 1,
            currentPlantId: null
          }
        });
      }

      return updatedPlant;
    });

    return {
      plant: completedPlant,
      isMaxStage: true,
      isCompleted: true
    };
  }

  // 다음 단계로 성장
  const updatedPlant = await prisma.plant.update({
    where: { id: plant.id },
    data: {
      currentStage: plant.currentStage + 1
    }
  });

  return {
    plant: updatedPlant,
    isMaxStage: updatedPlant.currentStage >= plant.plantType.growthStages,
    isCompleted: false
  };
};

/**
 * 식물 도감 조회 (완료된 식물 목록)
 */
export const getPlantCollection = async (childId: string) => {
  // 자녀 프로필 확인
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId }
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  // 완료된 식물 조회 (식물 유형별로 그룹화)
  const completedPlants = await prisma.plant.findMany({
    where: {
      childId,
      isCompleted: true
    },
    include: {
      plantType: true
    },
    orderBy: {
      completedAt: 'desc'
    }
  });

  // 식물 유형별로 그룹화
  const plantsByType = completedPlants.reduce((acc, plant) => {
    const typeId = plant.plantType.id;
    
    if (!acc[typeId]) {
      acc[typeId] = {
        plantType: plant.plantType,
        plants: []
      };
    }
    
    acc[typeId].plants.push(plant);
    
    return acc;
  }, {} as Record<string, { plantType: any, plants: any[] }>);

  // 배열로 변환
  return Object.values(plantsByType);
};

/**
 * 식물 건강 감소 처리 (스케줄러용)
 */
export const decreasePlantHealth = async () => {
  // 현재 진행 중인 모든 식물 조회
  const activePlants = await prisma.plant.findMany({
    where: {
      isCompleted: false
    }
  });

  const today = new Date();
  const results = [];

  // 각 식물의 건강 감소 처리
  for (const plant of activePlants) {
    const lastWatered = new Date(plant.lastWatered);
    const daysSinceLastWatered = Math.floor((today.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
    
    // 물주기를 3일 이상 안했으면 건강 감소
    if (daysSinceLastWatered >= 3) {
      // 일수에 비례해 건강 감소 (3일부터 하루당 5씩 감소)
      const healthDecrease = Math.min(plant.health, 5 * (daysSinceLastWatered - 2));
      
      // 건강이 0 이하면 식물 시들 위험
      const updatedHealth = Math.max(0, plant.health - healthDecrease);
      
      // 식물 상태 업데이트
      const updatedPlant = await prisma.plant.update({
        where: { id: plant.id },
        data: {
          health: updatedHealth
        }
      });
      
      // 건강이 30% 이하면 알림 생성
      if (updatedHealth <= 30) {
        try {
          // 자녀 정보 조회
          const childProfile = await prisma.childProfile.findUnique({
            where: { id: plant.childId },
            include: {
              user: true
            }
          });
          
          if (childProfile && childProfile.user) {
            // 알림 생성
            await prisma.notification.create({
              data: {
                userId: childProfile.user.id,
                title: '식물이 물이 필요해요!',
                content: `${plant.name || '식물'}의 건강이 좋지 않아요. 어서 물을 줘야 해요!`,
                notificationType: 'SYSTEM',
                relatedId: plant.id,
                isRead: false
              }
            });
          }
        } catch (error) {
          console.error('알림 생성 실패:', error);
        }
      }
      
      results.push({
        plantId: plant.id,
        previousHealth: plant.health,
        newHealth: updatedHealth,
        daysSinceLastWatered
      });
    }
  }

  return results;
};

/**
 * 식물 유형 추가 (관리자용)
 */
export const createPlantType = async (plantTypeData: {
  name: string;
  description?: string;
  growthStages: number;
  difficulty: string;
  category: string;
  unlockRequirement?: number;
  imagePrefix: string;
}) => {
  return prisma.plantType.create({
    data: plantTypeData
  });
};

export default {
  getAllPlantTypes,
  getPlantTypeById,
  getCurrentPlant,
  getChildPlants,
  startNewPlant,
  waterPlant,
  advancePlantStage,
  getPlantCollection,
  decreasePlantHealth,
  createPlantType
};