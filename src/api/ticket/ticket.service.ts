// src/api/ticket/ticket.service.ts
import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';
import { TicketType, RewardType, MissionType } from '@prisma/client';

/**
 * 자녀 프로필 ID 조회
 */
const getChildProfileId = async (userId: string): Promise<string> => {
  const childProfile = await prisma.childProfile.findFirst({
    where: {
      user: { id: userId },
    },
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  return childProfile.id;
};

/**
 * 약속 인증 완료 시 카운트 증가 및 보상 체크
 */
export const handleVerificationComplete = async (childId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 인증 카운트 증가
    const updatedProfile = await tx.childProfile.update({
      where: { id: childId },
      data: {
        verificationCount: { increment: 1 },
      },
    });

    // 마일스톤 보상 체크
    await checkAndGrantMilestoneRewards(
      tx,
      childId,
      RewardType.VERIFICATION_MILESTONE,
      updatedProfile.verificationCount
    );

    // 미션 진행도 업데이트
    await updateMissionProgress(
      tx,
      childId,
      [MissionType.DAILY_VERIFICATION, MissionType.WEEKLY_VERIFICATION, MissionType.MONTHLY_VERIFICATION]
    );

    return updatedProfile;
  });
};

/**
 * 식물 완료 시 카운트 증가 및 보상 체크
 */
export const handlePlantComplete = async (childId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 식물 완료 카운트 증가
    const updatedProfile = await tx.childProfile.update({
      where: { id: childId },
      data: {
        plantCompletionCount: { increment: 1 },
      },
    });

    // 마일스톤 보상 체크
    await checkAndGrantMilestoneRewards(
      tx,
      childId,
      RewardType.PLANT_COMPLETION,
      updatedProfile.plantCompletionCount
    );

    // 미션 진행도 업데이트
    await updateMissionProgress(tx, childId, [MissionType.PLANT_COMPLETION]);

    return updatedProfile;
  });
};

/**
 * 연속 물주기 체크 부분에서 미션 진행도 업데이트 수정
 */
export const handleWateringStreak = async (childId: string, streakCount: number) => {
  // 연속 7일, 14일, 30일 마다 보상 지급
  const milestones = [1, 3, 5, 7, 10, 13, 21, 28, 35, 42, 50,70,100];
  
  if (milestones.includes(streakCount)) {
    const ticketType = streakCount >= 100 ? TicketType.PREMIUM : TicketType.BASIC;
    const ticketCount = streakCount >= 100 ? 3 : streakCount >= 70 ? 2 : streakCount >= 50 ? 1 : 0;
    
    await grantTickets(
      childId,
      ticketType,
      ticketCount,
      `STREAK_${streakCount}_DAYS`
    );
  }

  // 미션 진행도 업데이트 - tx 없이 호출
  await updateMissionProgress(null, childId, [MissionType.STREAK_MAINTENANCE]);
};

/**
 * 마일스톤 보상 체크 및 지급
 */
const checkAndGrantMilestoneRewards = async (
  tx: any,
  childId: string,
  rewardType: RewardType,
  currentCount: number
) => {
  // 해당 아이와 전체 아이에게 적용되는 보상 규칙 조회
  const rewardRules = await tx.ticketReward.findMany({
    where: {
      AND: [
        {
          OR: [
            { childId: childId },
            { childId: null }, // 전체 아이에게 적용
          ],
        },
        { rewardType },
        { requiredCount: { lte: currentCount } },
        { isActive: true },
      ],
    },
    orderBy: { requiredCount: 'desc' },
  });

  // 아직 지급받지 않은 마일스톤 찾기
  for (const rule of rewardRules) {
    if (currentCount >= rule.requiredCount) {
      // 이미 해당 마일스톤으로 티켓을 받았는지 확인
      const existingTicket = await tx.drawTicket.findFirst({
        where: {
          childId,
          earnedFrom: `${rewardType}_${rule.requiredCount}`,
        },
      });

      if (!existingTicket) {
        // 티켓 지급
        await tx.drawTicket.create({
          data: {
            childId,
            ticketType: rule.ticketType,
            earnedFrom: `${rewardType}_${rule.requiredCount}`,
            earnedAt: new Date(),
          },
        });

        // 알림 생성
        const childProfile = await tx.childProfile.findUnique({
          where: { id: childId },
          include: { user: true },
        });

        if (childProfile) {
          await tx.notification.create({
            data: {
              userId: childProfile.user.id,
              title: '🎟️ 뽑기 티켓 획득!',
              content: `${getRewardTypeKorean(rewardType)} ${rule.requiredCount}회 달성으로 ${getTicketTypeKorean(rule.ticketType)} 티켓을 획득했어요!`,
              notificationType: 'SYSTEM',
              relatedId: null,
            },
          });
        }
      }
    }
  }
};

/**
 * 미션 진행도 업데이트
 */
const updateMissionProgress = async (
  tx: any,
  childId: string,
  missionTypes: MissionType[]
) => {
  const transaction = tx || prisma;

  // 활성화된 미션 조회
  const activeMissions = await transaction.mission.findMany({
    where: {
      OR: [
        { childId: childId },
        { childId: null }, // 전체 아이에게 적용
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
      missionType: { in: missionTypes },
      isActive: true,
      isCompleted: false,
    },
  });

  for (const mission of activeMissions) {
    const newCount = mission.currentCount + 1;
    const isCompleted = newCount >= mission.targetCount;

    await transaction.mission.update({
      where: { id: mission.id },
      data: {
        currentCount: newCount,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // 미션 완료 시 티켓 지급
    if (isCompleted) {
      await transaction.drawTicket.create({
        data: {
          childId,
          ticketType: mission.ticketReward,
          earnedFrom: `MISSION_${mission.id}`,
          earnedAt: new Date(),
        },
      });

      // 미션 완료 알림
      const childProfile = await transaction.childProfile.findUnique({
        where: { id: childId },
        include: { user: true },
      });

      if (childProfile) {
        await transaction.notification.create({
          data: {
            userId: childProfile.user.id,
            title: '🏆 미션 완료!',
            content: `"${mission.title}" 미션을 완료하여 ${getTicketTypeKorean(mission.ticketReward)} 티켓을 획득했어요!`,
            notificationType: 'SYSTEM',
            relatedId: mission.id,
          },
        });
      }
    }
  }
};

/**
 * 티켓 직접 지급
 */
export const grantTickets = async (
  childId: string,
  ticketType: TicketType,
  count: number,
  earnedFrom: string
) => {
  const tickets = [];
  
  for (let i = 0; i < count; i++) {
    tickets.push({
      childId,
      ticketType,
      earnedFrom,
      earnedAt: new Date(),
    });
  }

  return await prisma.drawTicket.createMany({
    data: tickets,
  });
};

/**
 * 아이의 보유 티켓 조회
 */
export const getChildTickets = async (userId: string) => {
  const childProfileId = await getChildProfileId(userId);

  return await prisma.drawTicket.findMany({
    where: {
      childId: childProfileId,
      isUsed: false,
    },
    orderBy: {
      earnedAt: 'desc',
    },
  });
};

/**
 * 티켓으로 뽑기 실행
 */
export const useTicketForDraw = async (
  userId: string,
  ticketId: string
) => {
  const childProfileId = await getChildProfileId(userId);

  return await prisma.$transaction(async (tx) => {
    // 티켓 확인 및 사용 처리
    const ticket = await tx.drawTicket.findFirst({
      where: {
        id: ticketId,
        childId: childProfileId,
        isUsed: false,
      },
    });

    if (!ticket) {
      throw new ApiError('사용 가능한 티켓을 찾을 수 없습니다.', 404);
    }

    // 티켓 사용 처리
    await tx.drawTicket.update({
      where: { id: ticketId },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    // 뽑기 실행 (기존 식물 뽑기 로직 활용)
    const { drawRandomPlant } = await import('../plant/plant.service');
    const drawResult = await drawRandomPlant(childProfileId, ticket.ticketType);

    // 뽑기 히스토리에 티켓 사용 정보 업데이트
    // drawResult에서 timestamp를 직접 참조하는 대신 최근 기록을 찾아서 업데이트
    const latestDrawHistory = await tx.plantDrawHistory.findFirst({
      where: {
        childId: childProfileId,
        plantTypeId: drawResult.plantType.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (latestDrawHistory) {
      await tx.plantDrawHistory.update({
        where: {
          id: latestDrawHistory.id,
        },
        data: {
          ticketUsed: true,
          ticketType: ticket.ticketType,
        },
      });
    }

    return drawResult;
  });
};

/**
 * 보상 타입 한국어 변환
 */
const getRewardTypeKorean = (rewardType: RewardType): string => {
  const typeMap = {
    VERIFICATION_MILESTONE: '약속 인증',
    PLANT_COMPLETION: '식물 완료',
    DAILY_STREAK: '연속 물주기',
    WEEKLY_MISSION: '주간 미션',
    MONTHLY_MISSION: '월간 미션',
  };
  return typeMap[rewardType] || rewardType;
};

/**
 * 티켓 타입 한국어 변환
 */
const getTicketTypeKorean = (ticketType: TicketType): string => {
  const typeMap = {
    BASIC: '기본',
    PREMIUM: '프리미엄',
    SPECIAL: '스페셜',
  };
  return typeMap[ticketType] || ticketType;
};

/**
 * 기본 마일스톤 보상 규칙 생성
 */
export const createDefaultMilestoneRewards = async () => {
  const defaultRewards = [
    // 약속 인증 마일스톤
    { rewardType: RewardType.VERIFICATION_MILESTONE, requiredCount: 1, ticketType: TicketType.BASIC, description: '첫 번째 약속 인증 1회 달성' },
    { rewardType: RewardType.VERIFICATION_MILESTONE, requiredCount: 5, ticketType: TicketType.BASIC, description: '약속 인증 5회 달성' },
    { rewardType: RewardType.VERIFICATION_MILESTONE, requiredCount: 10, ticketType: TicketType.BASIC, description: '약속 인증 10회 달성' },
    { rewardType: RewardType.VERIFICATION_MILESTONE, requiredCount: 25, ticketType: TicketType.PREMIUM, description: '약속 인증 25회 달성' },
    { rewardType: RewardType.VERIFICATION_MILESTONE, requiredCount: 50, ticketType: TicketType.PREMIUM, description: '약속 인증 50회 달성' },
    { rewardType: RewardType.VERIFICATION_MILESTONE, requiredCount: 100, ticketType: TicketType.SPECIAL, description: '약속 인증 100회 달성' },
    
    // 식물 완료 마일스톤
    { rewardType: RewardType.PLANT_COMPLETION, requiredCount: 1, ticketType: TicketType.BASIC, description: '첫 번째 식물 완료' },
    { rewardType: RewardType.PLANT_COMPLETION, requiredCount: 3, ticketType: TicketType.BASIC, description: '식물 3개 완료' },
    { rewardType: RewardType.PLANT_COMPLETION, requiredCount: 5, ticketType: TicketType.PREMIUM, description: '식물 5개 완료' },
    { rewardType: RewardType.PLANT_COMPLETION, requiredCount: 10, ticketType: TicketType.PREMIUM, description: '식물 10개 완료' },
    { rewardType: RewardType.PLANT_COMPLETION, requiredCount: 20, ticketType: TicketType.SPECIAL, description: '식물 20개 완료' },
  ];

  for (const reward of defaultRewards) {
    // 기존 보상이 있는지 확인
    const existingReward = await prisma.ticketReward.findFirst({
      where: {
        childId: null,
        rewardType: reward.rewardType,
        requiredCount: reward.requiredCount,
      },
    });

    // 없으면 생성
    if (!existingReward) {
      await prisma.ticketReward.create({
        data: {
          ...reward,
          childId: null,
        },
      });
    }
  }
};