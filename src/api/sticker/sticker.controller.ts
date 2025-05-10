import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as stickerService from './sticker.service';

/**
 * 스티커 생성 (부모 전용)
 * @route POST /api/stickers
 */
export const createSticker = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { childId, title, description, rewardId } = req.body;
  
  // 이미지 파일 경로 (업로드 미들웨어에서 설정)
  const imageUrl = req.file?.path || null;
  
  const result = await stickerService.createSticker(
    req.user.id,
    childId,
    title,
    description || null,
    imageUrl,
    rewardId || null
  );
  
  res.status(201).json({
    success: true,
    message: '스티커가 성공적으로 생성되었습니다.',
    data: result
  });
});

/**
 * 자녀의 스티커 목록 조회 (자녀 전용)
 * @route GET /api/stickers/child
 */
export const getChildStickers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const stickers = await stickerService.getChildStickers(req.user.id, false);
  
  res.status(200).json({
    success: true,
    data: stickers
  });
});

/**
 * 특정 자녀의 스티커 목록 조회 (부모 전용)
 * @route GET /api/stickers/child/:childId
 */
export const getChildStickersByParent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { childId } = req.params;
  
  const stickers = await stickerService.getChildStickersByParent(req.user.id, childId);
  
  res.status(200).json({
    success: true,
    data: stickers
  });
});

/**
 * 스티커 상세 조회
 * @route GET /api/stickers/:id
 */
export const getStickerById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  const sticker = await stickerService.getStickerById(id, req.user.id);
  
  res.status(200).json({
    success: true,
    data: sticker
  });
});

/**
 * 스티커 삭제 (부모 전용)
 * @route DELETE /api/stickers/:id
 */
export const deleteSticker = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  await stickerService.deleteSticker(id, req.user.id);
  
  res.status(200).json({
    success: true,
    message: '스티커가 성공적으로 삭제되었습니다.'
  });
});

/**
 * 스티커 통계 (자녀용)
 * @route GET /api/stickers/stats
 */
export const getChildStickerStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const stats = await stickerService.getChildStickerStats(req.user.id);
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * 특정 자녀의 스티커 개수 조회
 * @route GET /api/stickers/child/:childId/count
 */
export const getChildStickerCount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { childId } = req.params;
  
  const stickerStats = await stickerService.getChildStickerCount(childId, req.user.id);
  
  res.status(200).json({
    success: true,
    data: stickerStats
  });
});

