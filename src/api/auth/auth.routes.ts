import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate, requireParent } from '../../middleware/auth.middleware';
import { 
  loginSchema, 
  parentSignupSchema, 
  childSignupSchema, 
  changePasswordSchema 
} from './auth.validation';

const router = express.Router();

// 회원가입 라우트
router.post('/parent/signup', validate(parentSignupSchema), authController.parentSignup);
router.post('/child/signup', validate(childSignupSchema), authController.childSignup);

// 로그인 라우트
router.post('/login', validate(loginSchema), authController.login);

// 비밀번호 변경 라우트
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

// 부모 연결 코드 생성 라우트
router.get('/parent/connection-code', authenticate, requireParent, authController.getParentConnectionCode);

// 자녀와 부모 연결 라우트
router.post('/child/connect-parent', authenticate, authController.connectParent);

export default router;