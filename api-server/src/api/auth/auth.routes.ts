// src/api/auth/auth.routes.ts - 라우트 순서 수정
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
  requestChildPasswordResetSchema,
  checkUsernameSchema
} from './auth.validation';

const router = express.Router();

//  1. 가장 구체적인 라우트
router.get('/parent/children-for-reset', authenticate, requireParent, authController.getChildrenForPasswordReset);
router.get('/parent/connection-code', authenticate, requireParent, authController.getParentConnectionCode);
router.post('/parent/signup', validate(parentSignupSchema), authController.parentSignup);
router.post('/parent/reset-child-password', authenticate, requireParent, validate(resetChildPasswordSchema), authController.resetChildPassword);
router.post('/parent/reset-child-password-temporary', authenticate, requireParent, validate(requestChildPasswordResetSchema), authController.resetChildPasswordTemporary);
router.post('/check-username', validate(checkUsernameSchema), authController.checkUsername);

//  2. 자녀 관련 라우트
router.post('/child/signup', validate(childSignupSchema), authController.childSignup);
router.post('/child/connect-parent', authenticate, authController.connectParent);

//  3. 소셜 로그인 관련 라우트
router.post('/social/google', validate(socialSignInSchema), authController.googleSignIn);
router.post('/social/apple', validate(socialSignInSchema), authController.appleSignIn);
router.post('/social/complete-setup', authenticate, validate(socialSetupSchema), authController.completeSocialSetup);
router.post('/set-social-password', authenticate, validate(setSocialPasswordSchema), authController.setSocialAccountPassword);

//  4. OAuth 콜백 라우트들 (구체적인 경로)
router.get('/callback/google', authController.googleCallback);
router.get('/callback/apple', authController.appleCallback);

//  5. 일반 인증 라우트
router.post('/login', validate(loginSchema), authController.login);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.get('/setup-status', authenticate, authController.getSetupStatus);

//  6. 비밀번호 재설정 관련
router.post('/find-username', validate(findUsernameSchema), authController.findUsername);
router.post('/request-password-reset', validate(requestPasswordResetSchema), authController.requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

//  7. 계정 관리
router.post('/deactivate-account', authenticate, validate(deleteAccountSchema), authController.deactivateAccount);
router.delete('/delete-account', authenticate, validate(deleteAccountSchema), authController.deleteAccount);

//  8. 가장 일반적인 라우트 (맨 마지막에!)
router.get('/oauth/redirect', authController.oauthRedirect);

export default router;