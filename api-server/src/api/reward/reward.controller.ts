import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as rewardService from './reward.service';


const convertBigIntToNumber = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // BigInt인 경우 Number로 변환
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  // 배열인 경우 각 요소에 재귀 적용
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToNumber(item));
  }
  
  // 객체인 경우 각 프로퍼티에 재귀 적용
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertBigIntToNumber(obj[key]);
      }
    }
    return result;
  }
  
  // 그 외의 경우 그대로 반환
  return obj;
};


/**
 * 보상 생성 (부모 전용)
 * @route POST /api/rewards
 */
export const createReward = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { title, description, requiredStickers, isActive } = req.body;
  
  const result = await rewardService.createReward(
    req.user.id,
    title,
    description || null,
    requiredStickers,
    isActive !== undefined ? isActive : true
  );
  
  res.status(201).json({
    success: true,
    message: '보상이 성공적으로 생성되었습니다.',
    data: result
  });
});

/**
 * 부모의 보상 목록 조회
 * @route GET /api/rewards/parent
 */
export const getParentRewards = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const rewards = await rewardService.getParentRewards(req.user.id);
  
  res.status(200).json({
    success: true,
    data: rewards
  });
});

/**
 * 자녀의 보상 목록 조회
 * @route GET /api/rewards/child
 */
export const getChildRewards = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const rewards = await rewardService.getChildRewards(req.user.id);
  
  // 최종 결과 변환 후 응답
  const safeRewards = convertBigIntToNumber(rewards);
  
  res.json({ success: true, data: safeRewards });
});

/**
 * 보상 상세 조회
 * @route GET /api/rewards/:id
 */
export const getRewardById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  const reward = await rewardService.getRewardById(id, req.user.id);
  
  res.status(200).json({
    success: true,
    data: reward
  });
});

/**
 * 보상 업데이트 (부모 전용)
 * @route PUT /api/rewards/:id
 */
export const updateReward = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  const { title, description, requiredStickers, isActive } = req.body;
  
  const updateData: any = {};
  
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (requiredStickers !== undefined) updateData.requiredStickers = requiredStickers;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  const reward = await rewardService.updateReward(id, req.user.id, updateData);
  
  res.status(200).json({
    success: true,
    message: '보상이 성공적으로 수정되었습니다.',
    data: reward
  });
});

/**
 * 보상 삭제 (부모 전용)
 * @route DELETE /api/rewards/:id
 */
export const deleteReward = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  await rewardService.deleteReward(id, req.user.id);
  
  res.status(200).json({
    success: true,
    message: '보상이 성공적으로 삭제되었습니다.'
  });
});

/**
 * 보상 달성 (자녀 전용)
 * @route POST /api/rewards/:id/achieve
 */
export const achieveReward = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  const result = await rewardService.achieveReward(id, req.user.id);
  
  res.status(200).json({
    success: true,
    message: '보상이 성공적으로 달성되었습니다.',
    data: result
  });
});

/**
 * 보상 이력 조회 (부모/자녀 공통)
 * @route GET /api/rewards/history
 */
export const getRewardHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const result = await rewardService.getRewardHistory(req.user.id);
  
  // 최종 결과 변환 후 응답
  const safeResult = convertBigIntToNumber(result);
  
  res.json({ success: true, data: safeResult });
});