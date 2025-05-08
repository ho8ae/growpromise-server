import express from 'express';
import * as rewardController from './reward.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate, requireParent } from '../../middleware/auth.middleware';
import { createRewardSchema, updateRewardSchema } from './reward.validation';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 부모 라우트
router.post('/', requireParent, validate(createRewardSchema), rewardController.createReward);
router.get('/parent', requireParent, rewardController.getParentRewards);
router.put('/:id', requireParent, validate(updateRewardSchema), rewardController.updateReward);
router.delete('/:id', requireParent, rewardController.deleteReward);

// 자녀 라우트
router.get('/child', rewardController.getChildRewards);
router.post('/:id/achieve', rewardController.achieveReward);

// 공통 라우트
router.get('/:id', rewardController.getRewardById);

export default router;