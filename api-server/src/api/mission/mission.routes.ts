// src/api/mission/mission.routes.ts
import express from 'express';
import * as missionController from './mission.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate, requireChild } from '../../middleware/auth.middleware';
import { createMissionSchema } from '../ticket/ticket.validation';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 아이용 라우트
router.get('/active', requireChild, missionController.getActiveMissions);
router.get('/completed', requireChild, missionController.getCompletedMissions);

// 관리자용 라우트 (향후 관리자 미들웨어 추가 필요)
router.post('/', validate(createMissionSchema), missionController.createMission);
router.put('/:id', missionController.updateMission);
router.delete('/:id', missionController.deleteMission);
router.post('/admin/create-defaults', missionController.createDefaultMissions);
router.post('/admin/cleanup', missionController.cleanupExpiredMissions);

export default router;