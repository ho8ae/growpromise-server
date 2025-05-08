import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as userService from './user.service';

/**
 * 프로필 정보 조회
 * @route GET /api/users/profile
 */
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const profile = await userService.getUserProfile(req.user.id);
  
  res.status(200).json({
    success: true,
    data: profile
  });
});

/**
 * 프로필 정보 업데이트
 * @route PATCH /api/users/profile
 */
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { username, email, birthDate } = req.body;
  
  const updateData: any = {};
  
  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (birthDate !== undefined) updateData.birthDate = birthDate ? new Date(birthDate) : null;
  
  const updatedProfile = await userService.updateUserProfile(req.user.id, updateData);
  
  res.status(200).json({
    success: true,
    message: '프로필이 성공적으로 업데이트되었습니다.',
    data: updatedProfile
  });
});

/**
 * 프로필 이미지 업데이트
 * @route PATCH /api/users/profile/image
 */
export const updateProfileImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  // 이미지 파일 경로 (업로드 미들웨어에서 설정)
  const imagePath = req.file?.path;
  
  if (!imagePath) {
    return res.status(400).json({
      success: false,
      message: '프로필 이미지가 필요합니다.'
    });
  }
  
  const updatedProfile = await userService.updateProfileImage(req.user.id, imagePath);
  
  res.status(200).json({
    success: true,
    message: '프로필 이미지가 성공적으로 업데이트되었습니다.',
    data: updatedProfile
  });
});

/**
 * 자녀 목록 조회 (부모용)
 * @route GET /api/users/children
 */
export const getParentChildren = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const children = await userService.getParentChildren(req.user.id);
  
  res.status(200).json({
    success: true,
    data: children
  });
});

/**
 * 부모 목록 조회 (자녀용)
 * @route GET /api/users/parents
 */
export const getChildParents = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const parents = await userService.getChildParents(req.user.id);
  
  res.status(200).json({
    success: true,
    data: parents
  });
});

/**
 * 사용자 상세 정보 조회
 * @route GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  const user = await userService.getUserById(id, req.user.id);
  
  res.status(200).json({
    success: true,
    data: user
  });
});