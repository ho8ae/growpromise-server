import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';
import { MissionType, TicketType } from '@prisma/client';

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
 * 아이의 활성 미션 목록 조회
 */
export const getActiveMissions = async (userId: string) => {
  const childProfileId = await getChildProfileId(userId);

  return await prisma.mission.findMany({
    where: {
      AND: [
        {
          OR: [
            { childId: childProfileId },
            { childId: null }, // 전체 아이에게 적용
          ],
        },
        { isActive: true },
        { isCompleted: false },
        {
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
        },
      ],
    },
    orderBy: [
      { endDate: { sort: 'asc', nulls: 'last' } }, // null 값을 마지막으로 정렬
      { createdAt: 'desc' },
    ],
  });
};

/**
 * 아이의 완료된 미션 목록 조회
 */
export const getCompletedMissions = async (userId: string) => {
  const childProfileId = await getChildProfileId(userId);

  return await prisma.mission.findMany({
    where: {
      AND: [
        {
          OR: [
            { childId: childProfileId },
            { childId: null },
          ],
        },
        { isCompleted: true },
      ],
    },
    orderBy: {
      completedAt: 'desc',
    },
  });
};

/**
 * 새 미션 생성
 */
export const createMission = async (missionData: {
  childId?: string;
  title: string;
  description: string;
  missionType: MissionType;
  targetCount: number;
  ticketReward?: TicketType;
  ticketCount?: number;
  endDate?: Date;
}) => {
  return await prisma.mission.create({
    data: {
      ...missionData,
      ticketReward: missionData.ticketReward || TicketType.BASIC,
      ticketCount: missionData.ticketCount || 1,
    },
  });
};

/**
 * 미션 수정
 */
export const updateMission = async (
  missionId: string,
  updateData: Partial<{
    title: string;
    description: string;
    targetCount: number;
    ticketReward: TicketType;
    ticketCount: number;
    endDate: Date | null;
    isActive: boolean;
  }>
) => {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
  });

  if (!mission) {
    throw new ApiError('미션을 찾을 수 없습니다.', 404);
  }

  if (mission.isCompleted) {
    throw new ApiError('완료된 미션은 수정할 수 없습니다.', 400);
  }

  return await prisma.mission.update({
    where: { id: missionId },
    data: updateData,
  });
};

/**
 * 미션 삭제
 */
export const deleteMission = async (missionId: string) => {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
  });

  if (!mission) {
    throw new ApiError('미션을 찾을 수 없습니다.', 404);
  }

  return await prisma.mission.delete({
    where: { id: missionId },
  });
};

/**
 * 기본 미션 생성 (시스템 시작시 호출)
 */
export const createDefaultMissions = async () => {
  const defaultMissions = [
    {
      title: '매일 약속 지키기',
      description: '하루에 약속을 1개씩 인증해보세요!',
      missionType: MissionType.DAILY_VERIFICATION,
      targetCount: 7, // 7일 연속
      ticketReward: TicketType.BASIC,
      ticketCount: 1,
      endDate: null, // 무기한
    },
    {
      title: '이번 주 약속 달성',
      description: '일주일 동안 약속을 5개 이상 인증해보세요!',
      missionType: MissionType.WEEKLY_VERIFICATION,
      targetCount: 5,
      ticketReward: TicketType.PREMIUM,
      ticketCount: 1,
      endDate: getNextSunday(), // 다음 일요일까지
    },
    {
      title: '식물 키우기 마스터',
      description: '식물 3개를 완료해보세요!',
      missionType: MissionType.PLANT_COMPLETION,
      targetCount: 3,
      ticketReward: TicketType.PREMIUM,
      ticketCount: 2,
      endDate: null,
    },
    {
      title: '물주기 챔피언',
      description: '연속 14일 동안 식물에 물을 주어보세요!',
      missionType: MissionType.STREAK_MAINTENANCE,
      targetCount: 14,
      ticketReward: TicketType.SPECIAL,
      ticketCount: 1,
      endDate: null,
    },
  ];

  for (const missionData of defaultMissions) {
    // 고유한 식별자 생성
    const uniqueId = `${missionData.missionType}_${missionData.targetCount}_${missionData.ticketReward}`;
    
    try {
      await prisma.mission.upsert({
        where: {
          id: uniqueId,
        },
        update: {
          isActive: true, // 기존 미션이 있으면 활성화
        },
        create: {
          id: uniqueId,
          ...missionData,
          childId: null, // 전체 아이에게 적용
        },
      });
    } catch (error) {
      // ID 충돌 시 createMany 사용
      const existingMission = await prisma.mission.findFirst({
        where: {
          missionType: missionData.missionType,
          targetCount: missionData.targetCount,
          childId: null,
        },
      });

      if (!existingMission) {
        await prisma.mission.create({
          data: {
            ...missionData,
            childId: null,
          },
        });
      }
    }
  }
};

/**
 * 다음 일요일 날짜 계산
 */
const getNextSunday = (): Date => {
  const today = new Date();
  const daysUntilSunday = 7 - today.getDay();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  nextSunday.setHours(23, 59, 59, 999); // 일요일 끝까지
  return nextSunday;
};

/**
 * 만료된 미션 정리
 */
export const cleanupExpiredMissions = async () => {
  const now = new Date();
  
  // 만료된 미션을 비활성화
  const expiredMissions = await prisma.mission.updateMany({
    where: {
      endDate: { lt: now },
      isActive: true,
      isCompleted: false,
    },
    data: {
      isActive: false,
    },
  });

  return expiredMissions;
};
