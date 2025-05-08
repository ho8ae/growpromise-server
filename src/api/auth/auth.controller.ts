import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as authService from './auth.service';

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
  const { username, password, userType } = req.body;
  
  const result = await authService.loginUser(username, password, userType);
  
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