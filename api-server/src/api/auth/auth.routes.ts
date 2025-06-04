// src/api/auth/auth.routes.ts - 콜백 라우트 추가
import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate, requireParent } from '../../middleware/auth.middleware';
import { 
  loginSchema, 
  parentSignupSchema, 
  childSignupSchema, 
  changePasswordSchema,
  findUsernameSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  socialSignInSchema,
  socialSetupSchema,
  setSocialPasswordSchema,
  deleteAccountSchema,
  resetChildPasswordSchema,
  requestChildPasswordResetSchema
} from './auth.validation';

const router = express.Router();

// 기존 라우트들
router.post('/parent/signup', validate(parentSignupSchema), authController.parentSignup);
router.post('/child/signup', validate(childSignupSchema), authController.childSignup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.get('/parent/connection-code', authenticate, requireParent, authController.getParentConnectionCode);
router.post('/child/connect-parent', authenticate, authController.connectParent);
router.post('/find-username', validate(findUsernameSchema), authController.findUsername);
router.post('/request-password-reset', validate(requestPasswordResetSchema), authController.requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// 소셜 로그인 라우트
router.post('/social/google', validate(socialSignInSchema), authController.googleSignIn);
router.post('/social/apple', validate(socialSignInSchema), authController.appleSignIn);
router.post('/social/complete-setup', authenticate, validate(socialSetupSchema), authController.completeSocialSetup);
router.get('/setup-status', authenticate, authController.getSetupStatus);

// 🔥 새로 추가: OAuth 콜백 라우트들
router.get('/callback/google', authController.googleCallback);
router.get('/callback/apple', authController.appleCallback);
router.get('/oauth/redirect', authController.oauthRedirect);

// 계정 관리 라우트
router.post('/set-social-password', authenticate, validate(setSocialPasswordSchema), authController.setSocialAccountPassword);
router.post('/deactivate-account', authenticate, validate(deleteAccountSchema), authController.deactivateAccount);
router.delete('/delete-account', authenticate, validate(deleteAccountSchema), authController.deleteAccount);

router.get('/parent/children-for-reset', authenticate, requireParent, authController.getChildrenForPasswordReset);
router.post('/parent/reset-child-password', authenticate, requireParent, validate(resetChildPasswordSchema), authController.resetChildPassword);
router.post('/parent/reset-child-password-temporary', authenticate, requireParent, validate(requestChildPasswordResetSchema), authController.resetChildPasswordTemporary);


export default router;