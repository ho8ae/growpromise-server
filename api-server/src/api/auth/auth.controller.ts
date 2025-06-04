import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as authService from './auth.service';
import { prisma } from '../../app';


/**
 * Google 소셜 로그인 (1단계)
 * @route POST /api/auth/social/google
 */
export const googleSignIn = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, userInfo } = req.body; // userInfo로 변경
  
  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'Google ID 토큰이 필요합니다.'
    });
  }

  const result = await authService.socialSignIn('GOOGLE', idToken, userInfo);
  
  res.status(200).json({
    success: true,
    message: result.user.isNewUser ? 
      'Google 계정으로 가입되었습니다. 초기 설정을 완료해주세요.' : 
      'Google 로그인에 성공했습니다.',
    data: result
  });
});

/**
 * Apple 소셜 로그인 (1단계)
 * @route POST /api/auth/social/apple
 */
export const appleSignIn = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, userInfo } = req.body;
  
  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: 'Apple ID 토큰이 필요합니다.'
    });
  }

  const result = await authService.socialSignIn('APPLE', idToken, userInfo);
  
  res.status(200).json({
    success: true,
    message: result.user.isNewUser ? 
      'Apple 계정으로 가입되었습니다. 초기 설정을 완료해주세요.' : 
      'Apple 로그인에 성공했습니다.',
    data: result
  });
});

/**
 * 소셜 로그인 설정 완료 (2단계)
 * @route POST /api/auth/social/complete-setup
 */
export const completeSocialSetup = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  const { userType, birthDate, parentCode } = req.body;
  
  if (!userType) {
    return res.status(400).json({
      success: false,
      message: '사용자 타입을 선택해주세요.'
    });
  }

  const setupData = {
    birthDate: birthDate ? new Date(birthDate) : undefined,
    parentCode
  };

  const result = await authService.completeSocialSetup(req.user.id, userType, setupData);
  
  res.status(200).json({
    success: true,
    message: '초기 설정이 완료되었습니다.',
    data: result
  });
});

/**
 * 사용자 설정 상태 확인
 * @route GET /api/auth/setup-status
 */
export const getSetupStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      userType: true,
      setupCompleted: true,
      socialProvider: true
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '사용자를 찾을 수 없습니다.'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user,
      needsSetup: !user.setupCompleted
    }
  });
});


/**
 * 소셜 계정 비밀번호 설정
 * @route POST /api/auth/set-social-password
 */
export const setSocialAccountPassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  const { newPassword } = req.body;
  
  if (!newPassword) {
    return res.status(400).json({
      success: false,
      message: '새 비밀번호는 필수입니다.'
    });
  }
  
  const result = await authService.setSocialAccountPassword(req.user.id, newPassword);
  
  res.status(200).json({
    success: true,
    message: result.message,
    data: result
  });
});

/**
 * 계정 비활성화 (소프트 삭제)
 * @route POST /api/auth/deactivate-account
 */
export const deactivateAccount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  const { password } = req.body;
  
  const result = await authService.deactivateAccount(req.user.id, password);
  
  res.status(200).json({
    success: true,
    message: result.message,
    data: result
  });
});

/**
 * 계정 완전 삭제
 * @route DELETE /api/auth/delete-account
 */
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  const { password } = req.body;
  
  const result = await authService.deleteAccount(req.user.id, password);
  
  res.status(200).json({
    success: true,
    message: result.message,
    data: result
  });
});

/**
 * 부모 회원가입
 * @route POST /api/auth/parent/signup
 */
export const parentSignup = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  
  const result = await authService.createParentAccount(username, email, password);
  
  res.status(201).json({
    success: true,
    message: '부모 계정이 성공적으로 생성되었습니다.',
    data: result
  });
});

/**
 * 자녀 회원가입
 * @route POST /api/auth/child/signup
 */
export const childSignup = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, birthDate, parentCode } = req.body;
  
  const birthDateObj = birthDate ? new Date(birthDate) : undefined;
  const result = await authService.createChildAccount(username, password, birthDateObj, parentCode);
  
  res.status(201).json({
    success: true,
    message: '자녀 계정이 성공적으로 생성되었습니다.',
    data: result
  });
});

/**
 * 로그인
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  const result = await authService.loginUser(username, password);
  
  res.status(200).json({
    success: true,
    message: '로그인에 성공했습니다.',
    data: result
  });
});

/**
 * 부모 연결 코드 생성
 * @route GET /api/auth/parent/connection-code
 */
export const getParentConnectionCode = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const result = await authService.generateParentConnectionCode(req.user.id);
  
  res.status(200).json({
    success: true,
    message: '부모 연결 코드가 생성되었습니다.',
    data: result
  });
});

/**
 * 자녀와 부모 연결
 * @route POST /api/auth/child/connect-parent
 */
export const connectParent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { parentCode } = req.body;
  
  if (!parentCode) {
    return res.status(400).json({
      success: false,
      message: '부모 연결 코드가 필요합니다.'
    });
  }
  
  const result = await authService.connectChildToParent(req.user.id, parentCode);
  
  res.status(200).json({
    success: true,
    message: '부모와 성공적으로 연결되었습니다.',
    data: result
  });
});

/**
 * 비밀번호 변경
 * @route POST /api/auth/change-password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { currentPassword, newPassword } = req.body;
  
  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
  
  res.status(200).json({
    success: true,
    message: '비밀번호가 성공적으로 변경되었습니다.',
    data: result
  });
});

/**
 * 아이디 찾기
 * @route POST /api/auth/find-username
 */
export const findUsername = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: '이메일은 필수입니다.'
    });
  }
  
  const result = await authService.findUsername(email);
  
  res.status(200).json({
    success: true,
    message: '아이디를 찾았습니다.',
    data: result
  });
});

/**
 * 비밀번호 재설정 요청
 * @route POST /api/auth/request-password-reset
 */
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: '이메일은 필수입니다.'
    });
  }
  
  const result = await authService.generatePasswordResetToken(email);
  
  res.status(200).json({
    success: true,
    message: '비밀번호 재설정 이메일이 전송되었습니다.',
    data: result
  });
});

/**
 * 비밀번호 재설정
 * @route POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: '토큰과 새 비밀번호가 필요합니다.'
    });
  }
  
  const result = await authService.resetPassword(token, password);
  
  res.status(200).json({
    success: true,
    message: '비밀번호가 성공적으로 재설정되었습니다.',
    data: result
  });
});


/**
 * Google OAuth 콜백 처리
 * @route GET /api/auth/callback/google
 */
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('Google OAuth 오류:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'exp://localhost:8081'}?error=${encodeURIComponent(error as string)}`);
  }
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL || 'exp://localhost:8081'}?error=missing_code`);
  }
  
  try {
    // Authorization Code를 Access Token으로 교환
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.API_BASE_URL || 'http://localhost:3000/api'}/auth/callback/google`,
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      throw new Error('액세스 토큰을 받지 못했습니다.');
    }
    
    // 사용자 정보 가져오기
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    const userData = await userResponse.json();
    
    // 소셜 로그인 처리
    const result = await authService.socialSignIn('GOOGLE', tokens.id_token || tokens.access_token, userData);
    
    // 성공 시 앱으로 리디렉션 (토큰 포함)
    const redirectUrl = `${process.env.FRONTEND_URL || 'exp://localhost:8081'}?token=${encodeURIComponent(result.token)}&user=${encodeURIComponent(JSON.stringify(result.user))}&needsSetup=${result.needsSetup}`;
    
    res.redirect(redirectUrl);
    
  } catch (error: any) {
    console.error('Google 콜백 처리 오류:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'exp://localhost:8081'}?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Apple OAuth 콜백 처리
 * @route GET /api/auth/callback/apple
 */
export const appleCallback = asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error, id_token } = req.body; // Apple은 POST로 옴
  
  if (error) {
    console.error('Apple OAuth 오류:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'exp://localhost:8081'}?error=${encodeURIComponent(error as string)}`);
  }
  
  try {
    // Apple 로그인 처리
    const result = await authService.socialSignIn('APPLE', id_token, req.body.user);
    
    // 성공 시 앱으로 리디렉션
    const redirectUrl = `${process.env.FRONTEND_URL || 'exp://localhost:8081'}?token=${encodeURIComponent(result.token)}&user=${encodeURIComponent(JSON.stringify(result.user))}&needsSetup=${result.needsSetup}`;
    
    res.redirect(redirectUrl);
    
  } catch (error: any) {
    console.error('Apple 콜백 처리 오류:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'exp://localhost:8081'}?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * 범용 OAuth 리디렉션 처리 (Expo Auth Session용)
 * @route GET /api/auth/oauth/redirect
 */
export const oauthRedirect = asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  
  // 에러가 있으면 앱으로 에러와 함께 리디렉션
  if (error) {
    return res.redirect(`exp://localhost:8081?error=${encodeURIComponent(error as string)}`);
  }
  
  // 성공적인 인증 코드가 있으면 앱으로 리디렉션
  if (code) {
    return res.redirect(`exp://localhost:8081?code=${encodeURIComponent(code as string)}&state=${encodeURIComponent(state as string || '')}`);
  }
  
  // 그 외의 경우 (일반적인 리디렉션)
  const queryParams = new URLSearchParams(req.query as Record<string, string>);
  return res.redirect(`exp://localhost:8081?${queryParams.toString()}`);
});

/**
 * 부모의 자녀 목록 조회 (비밀번호 재설정용)
 * @route GET /api/auth/parent/children-for-reset
 */
export const getChildrenForPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  if (req.user.userType !== 'PARENT') {
    return res.status(403).json({
      success: false,
      message: '부모만 접근할 수 있습니다.'
    });
  }

  const children = await authService.getParentChildrenForPasswordReset(req.user.id);

  res.status(200).json({
    success: true,
    message: '자녀 목록을 조회했습니다.',
    data: children
  });
});

/**
 * 자녀 비밀번호 재설정
 * @route POST /api/auth/parent/reset-child-password
 */
export const resetChildPassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  if (req.user.userType !== 'PARENT') {
    return res.status(403).json({
      success: false,
      message: '부모만 접근할 수 있습니다.'
    });
  }

  const { childId, newPassword } = req.body;

  const result = await authService.resetChildPasswordByParent(req.user.id, childId, newPassword);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      childUsername: result.childUsername
    }
  });
});

/**
 * 임시 비밀번호로 자녀 비밀번호 재설정
 * @route POST /api/auth/parent/reset-child-password-temporary
 */
export const resetChildPasswordTemporary = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  if (req.user.userType !== 'PARENT') {
    return res.status(403).json({
      success: false,
      message: '부모만 접근할 수 있습니다.'
    });
  }

  const { childId } = req.body;

  const result = await authService.resetChildPasswordWithTemporary(req.user.id, childId);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      childUsername: result.childUsername,
      temporaryPassword: result.temporaryPassword
    }
  });
});
