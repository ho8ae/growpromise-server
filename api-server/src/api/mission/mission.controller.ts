import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as missionService from './mission.service';

/**
 * 아이의 활성 미션 목록 조회
 * @route GET /api/missions/active
 */
export const getActiveMissions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  const missions = await missionService.getActiveMissions(req.user.id);

  // 미션에 진행률 정보 추가
  const missionsWithProgress = missions.map(mission => ({
    ...mission,
    progressPercent: Math.round((mission.currentCount / mission.targetCount) * 100),
    progressText: `${mission.currentCount}/${mission.targetCount}`,
    isNearCompletion: mission.currentCount >= mission.targetCount * 0.8, // 80% 이상 진행
    daysLeft: mission.endDate ? Math.ceil((mission.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
  }));

  res.status(200).json({
    success: true,
    data: missionsWithProgress,
  });
});

/**
 * 아이의 완료된 미션 목록 조회
 * @route GET /api/missions/completed
 */
export const getCompletedMissions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  const missions = await missionService.getCompletedMissions(req.user.id);

  res.status(200).json({
    success: true,
    data: missions,
  });
});

/**
 * 관리자용 - 새 미션 생성
 * @route POST /api/missions
 */
export const createMission = asyncHandler(async (req: Request, res: Response) => {
  // TODO: 관리자 권한 확인 미들웨어 추가

  const missionData = req.body;
  const mission = await missionService.createMission(missionData);

  res.status(201).json({
    success: true,
    message: '새 미션이 생성되었습니다.',
    data: mission,
  });
});

/**
 * 관리자용 - 미션 수정
 * @route PUT /api/missions/:id
 */
export const updateMission = asyncHandler(async (req: Request, res: Response) => {
  // TODO: 관리자 권한 확인 미들웨어 추가

  const { id } = req.params;
  const updateData = req.body;

  const mission = await missionService.updateMission(id, updateData);

  res.status(200).json({
    success: true,
    message: '미션이 수정되었습니다.',
    data: mission,
  });
});

/**
 * 관리자용 - 미션 삭제
 * @route DELETE /api/missions/:id
 */
export const deleteMission = asyncHandler(async (req: Request, res: Response) => {
  // TODO: 관리자 권한 확인 미들웨어 추가

  const { id } = req.params;
  await missionService.deleteMission(id);

  res.status(200).json({
    success: true,
    message: '미션이 삭제되었습니다.',
  });
});

/**
 * 관리자용 - 기본 미션 생성
 * @route POST /api/missions/admin/create-defaults
 */
export const createDefaultMissions = asyncHandler(async (req: Request, res: Response) => {
  // TODO: 관리자 권한 확인 미들웨어 추가

  await missionService.createDefaultMissions();

  res.status(201).json({
    success: true,
    message: '기본 미션들이 생성되었습니다.',
  });
});

/**
 * 관리자용 - 만료된 미션 정리
 * @route POST /api/missions/admin/cleanup
 */
export const cleanupExpiredMissions = asyncHandler(async (req: Request, res: Response) => {
  // TODO: 관리자 권한 확인 미들웨어 추가

  const result = await missionService.cleanupExpiredMissions();

  res.status(200).json({
    success: true,
    message: `${result.count}개의 만료된 미션이 정리되었습니다.`,
    data: result,
  });
});