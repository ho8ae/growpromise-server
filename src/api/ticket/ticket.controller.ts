import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as ticketService from './ticket.service';
import { prisma } from '../../app'; // prisma import 추가

/**
 * 아이의 보유 티켓 조회
 * @route GET /api/tickets
 */
export const getMyTickets = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  const tickets = await ticketService.getChildTickets(req.user.id);

  // 티켓 타입별로 개수 집계
  const ticketCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.ticketType] = (acc[ticket.ticketType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.status(200).json({
    success: true,
    data: {
      tickets,
      counts: ticketCounts,
      total: tickets.length,
    },
  });
});

/**
 * 티켓으로 뽑기 실행
 * @route POST /api/tickets/:ticketId/use
 */
export const useTicket = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  const { ticketId } = req.params;

  if (!ticketId) {
    return res.status(400).json({
      success: false,
      message: '티켓 ID는 필수입니다.',
    });
  }

  const result = await ticketService.useTicketForDraw(req.user.id, ticketId);

  res.status(200).json({
    success: true,
    message: '티켓을 사용하여 새로운 식물을 획득했습니다!',
    data: result,
  });
});

/**
 * 티켓 타입별 뽑기 (코인 사용) - 기존 기능과 통합
 * @route POST /api/tickets/draw
 */
export const drawWithCoin = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  const { packType } = req.body;

  if (!packType) {
    return res.status(400).json({
      success: false,
      message: '팩 타입은 필수입니다.',
    });
  }

  // 기존 식물 뽑기 서비스 사용 (코인 소모)
  const { drawRandomPlant } = await import('../plant/plant.service');
  const childProfileId = req.user.profileId;

  if (!childProfileId) {
    return res.status(400).json({
      success: false,
      message: '프로필 ID를 찾을 수 없습니다.',
    });
  }

  const result = await drawRandomPlant(childProfileId, packType);

  res.status(200).json({
    success: true,
    message: '새로운 식물을 획득했습니다!',
    data: result,
  });
});

/**
 * 아이의 통계 조회 (카운트 정보 포함)
 * @route GET /api/tickets/stats
 */
export const getChildStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  // 자녀 프로필 조회
  const childProfile = await prisma.childProfile.findFirst({
    where: {
      user: { id: req.user.id },
    },
    include: {
      tickets: {
        where: { isUsed: false },
      },
      missions: {
        where: {
          AND: [
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
      },
    },
  });

  if (!childProfile) {
    return res.status(404).json({
      success: false,
      message: '자녀 프로필을 찾을 수 없습니다.',
    });
  }

  // 티켓 개수 집계
  const ticketCounts = childProfile.tickets.reduce((acc, ticket) => {
    acc[ticket.ticketType] = (acc[ticket.ticketType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.status(200).json({
    success: true,
    data: {
      verificationCount: childProfile.verificationCount,
      plantCompletionCount: childProfile.plantCompletionCount,
      wateringStreak: childProfile.wateringStreak,
      totalCompletedPlants: childProfile.totalCompletedPlants,
      characterStage: childProfile.characterStage,
      tickets: {
        counts: ticketCounts,
        total: childProfile.tickets.length,
      },
      activeMissions: childProfile.missions.map(mission => ({
        id: mission.id,
        title: mission.title,
        description: mission.description,
        progress: `${mission.currentCount}/${mission.targetCount}`,
        progressPercent: Math.round((mission.currentCount / mission.targetCount) * 100),
        reward: mission.ticketReward,
        endDate: mission.endDate,
      })),
    },
  });
});

/**
 * 관리자용 - 마일스톤 보상 규칙 생성
 * @route POST /api/tickets/admin/create-milestones
 */
export const createDefaultMilestones = asyncHandler(async (req: Request, res: Response) => {
  // TODO: 관리자 권한 확인 미들웨어 추가

  await ticketService.createDefaultMilestoneRewards();

  res.status(201).json({
    success: true,
    message: '기본 마일스톤 보상 규칙이 생성되었습니다.',
  });
});

/**
 * 관리자용 - 특정 아이에게 티켓 지급
 * @route POST /api/tickets/admin/grant
 */
export const grantTicketsToChild = asyncHandler(async (req: Request, res: Response) => {
  // TODO: 관리자 권한 확인 미들웨어 추가

  const { childId, ticketType, count, reason } = req.body;

  if (!childId || !ticketType || !count) {
    return res.status(400).json({
      success: false,
      message: '아이 ID, 티켓 타입, 개수는 필수입니다.',
    });
  }

  await ticketService.grantTickets(
    childId,
    ticketType,
    count,
    reason || 'ADMIN_GRANT'
  );

  res.status(200).json({
    success: true,
    message: `${count}개의 ${ticketType} 티켓이 지급되었습니다.`,
  });
});