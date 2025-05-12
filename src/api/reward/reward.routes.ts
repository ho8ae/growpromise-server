// src/api/reward/reward.routes.ts
import express from 'express';
import * as rewardController from './reward.controller';
import { validate } from '../../middleware/validation.middleware';
import { 
  authenticate, 
  requireParent, 
  requireChild, 
  checkParentChildRelationship 
} from '../../middleware/auth.middleware';
import { createRewardSchema, updateRewardSchema } from './reward.validation';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 공통 라우트 - 경로 순서 중요: 더 구체적인 경로가 먼저 와야 함
router.get('/history', rewardController.getRewardHistory);
router.get('/parent', requireParent, rewardController.getParentRewards);
router.get('/child', requireChild, rewardController.getChildRewards);

// 부모 라우트
router.post('/', requireParent, validate(createRewardSchema), rewardController.createReward);
router.put('/:id', requireParent, validate(updateRewardSchema), rewardController.updateReward);
router.delete('/:id', requireParent, rewardController.deleteReward);

// 자녀 라우트
router.post('/:id/achieve', requireChild, rewardController.achieveReward);

// 상세 조회 라우트 (마지막에 배치)
router.get('/:id', rewardController.getRewardById);

export default router;