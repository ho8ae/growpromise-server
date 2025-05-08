import express from 'express';
import * as promiseController from './promise.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate, requireParent } from '../../middleware/auth.middleware';
import { uploadPromiseImage } from '../../middleware/upload.middleware';
import {
  createPromiseSchema,
  updatePromiseSchema,
  submitVerificationSchema,
  responseVerificationSchema
} from './promise.validation';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate);

// 부모 라우트
router.post('/', requireParent, validate(createPromiseSchema), promiseController.createPromise);
router.get('/children', requireParent, promiseController.getParentChildren);
router.get('/', requireParent, promiseController.getParentPromises);
router.get('/verifications/pending', requireParent, promiseController.getPendingVerifications);
router.post('/verify/respond/:id', requireParent, validate(responseVerificationSchema), promiseController.respondToVerification);

// 자녀 라우트
router.get('/child', promiseController.getChildPromises);
router.get('/stats', promiseController.getChildPromiseStats);
router.post('/verify', uploadPromiseImage, validate(submitVerificationSchema), promiseController.submitVerification);

// 공통 라우트
router.get('/:id', promiseController.getPromiseById);
router.put('/:id', requireParent, validate(updatePromiseSchema), promiseController.updatePromise);
router.delete('/:id', requireParent, promiseController.deletePromise);

export default router;