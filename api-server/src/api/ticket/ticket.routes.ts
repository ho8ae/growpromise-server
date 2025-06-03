// src/api/ticket/ticket.routes.ts
import express from 'express';
import * as ticketController from './ticket.controller';
import { authenticate, requireChild } from '../../middleware/auth.middleware';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 아이용 라우트
router.post('/:ticketId/use', requireChild, ticketController.useTicket);
router.post('/draw', requireChild, ticketController.drawWithCoin);
router.get('/', requireChild, ticketController.getMyTickets);
router.get('/stats', requireChild, ticketController.getChildStats);

// 관리자용 라우트 (향후 관리자 미들웨어 추가 필요)
router.post('/admin/create-milestones', ticketController.createDefaultMilestones);
router.post('/admin/grant', ticketController.grantTicketsToChild);

export default router;