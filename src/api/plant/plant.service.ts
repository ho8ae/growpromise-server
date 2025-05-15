import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';
import { getPlantImageUrl, getPlantStageImages } from '../../utils/imageUrl';

/**
 * 모든 식물 유형 조회
 */
export const getAllPlantTypes = async (childId?: string) => {
  // 기본 쿼리
  const baseQuery = {
    orderBy: { unlockRequirement: 'asc' as const }
  };

  let plantTypes;

  // 자녀 ID가 있으면 해당 자녀가 잠금 해제한 식물만 필터링
  if (childId) {
    const childProfile = await prisma.childProfile.findUnique({
      where: { id: childId }
    });

    if (!childProfile) {
      throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
    }

    // 자녀가 잠금 해제한 식물 유형 필터링
    plantTypes = await prisma.plantType.findMany({
      where: {
        OR: [
          { unlockRequirement: null }, // 기본적으로 잠금 해제된 식물
          { unlockRequirement: { lte: childProfile.totalCompletedPlants } } // 조건을 충족하는 식물
        ]
      },
      ...baseQuery
    });
  } else {
    // 모든 식물 유형 반환
    plantTypes = await prisma.plantType.findMany(baseQuery);
  }

  // 이미지 URL 추가
  return plantTypes.map(plantType => ({
    ...plantType,
    imageUrls: getPlantStageImages(plantType),
    previewImageUrl: getPlantImageUrl(plantType.imagePrefix, 1) // 대표 이미지는 1단계
  }));
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
          plantType: true,
          wateringLogs: {
            orderBy: {
              timestamp: 'desc' as const
            },
            take: 5
          }
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

  const currentPlant = childProfile.plants[0];
  
  // 이미지 URL 추가
  return {
    ...currentPlant,
    imageUrl: getPlantImageUrl(
      currentPlant.plantType.imagePrefix, 
      currentPlant.currentStage
    ),
    allStageImageUrls: getPlantStageImages(currentPlant.plantType)
  };
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
      plantType: true,
      wateringLogs: {
        orderBy: {
          timestamp: 'desc' as const
        },
        take: 5
      }
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

  // 새 식물을 위한 경험치 요구량 계산
  // 난이도와 성장 단계에 따라 경험치 요구량 결정
  const baseExperience = 10; // 기본 경험치 요구량
  const difficultyMultiplier = 
    plantType.difficulty === 'EASY' ? 1 :
    plantType.difficulty === 'MEDIUM' ? 1.5 :
    plantType.difficulty === 'HARD' ? 2 : 1;
  
  const experienceToGrow = Math.round(baseExperience * difficultyMultiplier);

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
      startedAt: new Date(),
      experience: 0,
      experienceToGrow: experienceToGrow,
      canGrow: false
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
  
  // 물주기 경험치 추가
  const experienceGain = 5; // 기본 물주기 경험치
  
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

  // 연속 물주기에 따른 추가 경험치
  const streakBonusExperience = Math.min(5, wateringStreak); // 최대 5일까지 보너스 경험치
  const totalExperienceGain = experienceGain + streakBonusExperience;
  
  // 새로운 경험치 계산
  const newExperience = plant.experience + totalExperienceGain;
  const canGrow = newExperience >= plant.experienceToGrow;

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
        experience: newExperience,
        canGrow
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
 * 경험치 요구량 계산
 */
const calculateNextExperienceRequirement = (plant: any) => {
  // 식물 난이도에 따른 기본 경험치 설정
  const baseExperience = 10;
  const difficultyMultiplier = 
    plant.plantType.difficulty === 'EASY' ? 1 :
    plant.plantType.difficulty === 'MEDIUM' ? 1.5 :
    plant.plantType.difficulty === 'HARD' ? 2 : 1;
  
  // 성장 단계에 따라 경험치 증가
  const stageMultiplier = 1 + (plant.currentStage * 0.5);
  
  // 다음 단계 경험치 요구량
  return Math.round(baseExperience * difficultyMultiplier * stageMultiplier);
};

/**
 * 약속 완료로 경험치 추가
 */
export const addExperienceToPlant = async (plantId: string, experienceAmount: number) => {
  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    include: { plantType: true }
  });
  
  if (!plant) {
    throw new ApiError('식물을 찾을 수 없습니다.', 404);
  }
  
  if (plant.isCompleted) {
    throw new ApiError('이미 완료된 식물입니다.', 400);
  }
  
  // 경험치 계산
  const newExperience = plant.experience + experienceAmount;
  const canGrow = newExperience >= plant.experienceToGrow;
  
  // 식물 업데이트
  return prisma.plant.update({
    where: { id: plantId },
    data: {
      experience: newExperience,
      canGrow
    }
  });
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
  
  // 성장 가능 여부 확인
  if (!plant.canGrow) {
    throw new ApiError('아직 성장할 수 없습니다. 약속을 더 완료하고 물을 주어 경험치를 모으세요.', 400);
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

  // 다음 단계 경험치 요구량 계산
  const nextExperienceToGrow = calculateNextExperienceRequirement(plant);

  // 다음 단계로 성장
  const updatedPlant = await prisma.plant.update({
    where: { id: plant.id },
    data: {
      currentStage: plant.currentStage + 1,
      experience: 0, // 경험치 초기화
      experienceToGrow: nextExperienceToGrow,
      canGrow: false // 성장 후 다시 경험치를 모아야 함
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
  
  // 명시적으로 타입 선언
  interface PlantHealthUpdate {
    plantId: string;
    previousHealth: number;
    newHealth: number;
    daysSinceLastWatered: number;
  }
  
  const results: PlantHealthUpdate[] = [];

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

/**
 * 식물 카드팩 종류
 */
export enum PackType {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  SPECIAL = 'SPECIAL'
}

/**
 * 카드팩 관련 정보
 */
interface PackInfo {
  price: number;
  rarityDistribution: {
    COMMON: number;
    UNCOMMON: number;
    RARE: number;
    EPIC: number;
    LEGENDARY: number;
  };
}

// 카드팩 별 정보 설정
const packInfoMap: Record<PackType, PackInfo> = {
  [PackType.BASIC]: {
    price: 100,
    rarityDistribution: {
      COMMON: 70,
      UNCOMMON: 25,
      RARE: 5,
      EPIC: 0,
      LEGENDARY: 0
    }
  },
  [PackType.PREMIUM]: {
    price: 300,
    rarityDistribution: {
      COMMON: 40,
      UNCOMMON: 35,
      RARE: 20,
      EPIC: 5,
      LEGENDARY: 0
    }
  },
  [PackType.SPECIAL]: {
    price: 500,
    rarityDistribution: {
      COMMON: 20,
      UNCOMMON: 30,
      RARE: 30,
      EPIC: 15,
      LEGENDARY: 5
    }
  }
};

/**
 * 랜덤 식물 뽑기
 */
export const drawRandomPlant = async (childId: string, packTypeStr: string) => {
  // 자녀 프로필 확인
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId },
    include: {
      user: true
    }
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }
  
  // 팩 타입 검증
  const packType = packTypeStr.toUpperCase() as PackType;
  if (!Object.values(PackType).includes(packType)) {
    throw new ApiError('유효하지 않은 팩 타입입니다.', 400);
  }
  
  // 팩 정보 가져오기
  const packInfo = packInfoMap[packType];
  
  // 자녀 코인 확인 (사용자에 코인 필드 추가 필요)
  const userCoins = await prisma.userCoin.findUnique({
    where: { userId: childProfile.userId }
  });
  
  if (!userCoins || userCoins.amount < packInfo.price) {
    throw new ApiError('코인이 부족합니다.', 400);
  }
  
  // 희귀도 결정
  const rarity = determineRarity(packInfo.rarityDistribution);
  
  // 해당 희귀도의 식물 유형 목록 가져오기
  const availablePlantTypes = await prisma.plantType.findMany({
    where: {
      rarity,
      // 이미 소유한 식물 제외 (선택적)
      NOT: {
        id: {
          in: await getOwnedPlantTypeIds(childId)
        }
      }
    }
  });
  
  if (availablePlantTypes.length === 0) {
    // 해당 희귀도에 모든 식물 유형을 이미 가지고 있는 경우, 모든 식물 유형 조회
    const allTypesOfRarity = await prisma.plantType.findMany({
      where: { rarity }
    });
    
    if (allTypesOfRarity.length === 0) {
      throw new ApiError('뽑을 수 있는 식물이 없습니다.', 404);
    }
    
    // 랜덤 선택
    const randomIndex = Math.floor(Math.random() * allTypesOfRarity.length);
    const selectedPlantType = allTypesOfRarity[randomIndex];
    
    // 코인 차감
    await prisma.userCoin.update({
      where: { userId: childProfile.userId },
      data: { amount: userCoins.amount - packInfo.price }
    });
    
    // 중복 식물이므로 중복 보상 지급 (예: 경험치)
    const experienceAmount = rarityToExperience(rarity);
    
    // 중복 보상 로그 남기기
    await prisma.plantDrawHistory.create({
      data: {
        childId,
        plantTypeId: selectedPlantType.id,
        packType,
        isDuplicate: true,
        experienceGained: experienceAmount
      }
    });
    
    // 현재 키우는 식물이 있는지 확인
    const currentPlant = await getCurrentPlant(childId);
    
    // 현재 식물이 있으면 경험치 추가
    if (currentPlant) {
      await addExperienceToPlant(currentPlant.id, experienceAmount);
    }
    
    return {
      plantType: selectedPlantType,
      isDuplicate: true,
      experienceGained: experienceAmount
    };
  }
  
  // 랜덤 식물 선택
  const randomIndex = Math.floor(Math.random() * availablePlantTypes.length);
  const selectedPlantType = availablePlantTypes[randomIndex];
  
  // 코인 차감
  await prisma.userCoin.update({
    where: { userId: childProfile.userId },
    data: { amount: userCoins.amount - packInfo.price }
  });
  
  // 식물 소유권 추가
  await prisma.plantInventory.create({
    data: {
      childId,
      plantTypeId: selectedPlantType.id,
      acquiredAt: new Date()
    }
  });
  
  // 뽑기 히스토리 저장
  await prisma.plantDrawHistory.create({
    data: {
      childId,
      plantTypeId: selectedPlantType.id,
      packType,
      isDuplicate: false
    }
  });
  
  return {
    plantType: selectedPlantType,
    isDuplicate: false
  };
};

/**
 * 주어진 확률 분포에 따라 희귀도 결정
 */
const determineRarity = (distribution: Record<string, number>) => {
  const random = Math.random() * 100;
  let cumulativeProbability = 0;
  
  for (const [rarity, probability] of Object.entries(distribution)) {
    cumulativeProbability += probability;
    if (random <= cumulativeProbability) {
      return rarity;
    }
  }
  
  // 기본값 (만약 모든 조건을 만족하지 않는 경우)
  return 'COMMON';
};

/**
 * 희귀도에 따른 경험치 보상
 */
const rarityToExperience = (rarity: string) => {
  switch (rarity) {
    case 'COMMON': return 10;
    case 'UNCOMMON': return 20;
    case 'RARE': return 30;
    case 'EPIC': return 50;
    case 'LEGENDARY': return 100;
    default: return 10;
  }
};

/**
 * 이미 소유한 식물 유형 ID 목록 가져오기
 */
const getOwnedPlantTypeIds = async (childId: string) => {
  const inventory = await prisma.plantInventory.findMany({
    where: { childId },
    select: { plantTypeId: true }
  });
  
  return inventory.map(item => item.plantTypeId);
};

/**
 * 소유한 식물 유형 목록 조회
 */
export const getPlantInventory = async (childId: string) => {
  // 자녀 프로필 확인
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId }
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }
  
  // 보유한 식물 유형 목록 조회
  const inventory = await prisma.plantInventory.findMany({
    where: { childId },
    include: {
      plantType: true
    },
    orderBy: {
      acquiredAt: 'desc'
    }
  });
  
  return inventory;
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
  createPlantType,
  addExperienceToPlant
};