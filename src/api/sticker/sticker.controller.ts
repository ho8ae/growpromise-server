// src/api/sticker/sticker.controller.ts

import { asyncHandler } from '../../middleware/error.middleware';
import * as stickerService from './sticker.service';

/**
 * 모든 스티커 템플릿 조회
 * @route GET /api/stickers/templates
 */
export const getAllStickerTemplates = asyncHandler(async (req: any, res: any) => {
  const templates = await stickerService.getAllStickerTemplates();
  
  res.status(200).json({
    success: true,
    data: templates
  });
});

/**
 * 카테고리별 스티커 템플릿 조회
 * @route GET /api/stickers/templates/category/:category
 */
export const getStickerTemplatesByCategory = asyncHandler(async (req: any, res: any) => {
  const { category } = req.params;
  
  const templates = await stickerService.getStickerTemplatesByCategory(category);
  
  res.status(200).json({
    success: true,
    data: templates
  });
});

/**
 * 스티커 생성 (부모용)
 * @route POST /api/stickers
 */
export const createSticker = asyncHandler(async (req: any, res: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  const { title, description, childId, templateId } = req.body;
  
  const result = await stickerService.createSticker(
    req.user.id,
    childId,
    title,
    templateId,
    description
  );
  
  res.status(201).json({
    success: true,
    message: '스티커가 성공적으로 생성되었습니다.',
    data: result
  });
});

/**
 * 자녀의 스티커 목록 조회 (부모용)
 * @route GET /api/stickers/child/:childId
 */
export const getChildStickersByParent = asyncHandler(async (req: any, res: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { childId } = req.params;
  
  const stickers = await stickerService.getChildStickers(childId);
  
  res.status(200).json({
    success: true,
    data: stickers
  });
});

/**
 * 스티커 삭제
 * @route DELETE /api/stickers/:id
 */
export const deleteSticker = asyncHandler(async (req: any, res: any) => {
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
 * 자녀의 스티커 개수 조회 (부모용)
 * @route GET /api/stickers/child/:childId/count
 */
export const getChildStickerCount = asyncHandler(async (req: any, res: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { childId } = req.params;
  
  const count = await stickerService.getChildStickerCount(childId);
  
  res.status(200).json({
    success: true,
    data: { count }
  });
});

/**
 * 자신의 스티커 목록 조회 (자녀용)
 * @route GET /api/stickers/child
 */
export const getChildStickers = asyncHandler(async (req: any, res: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const stickers = await stickerService.getChildStickersByUserId(req.user.id);
  
  res.status(200).json({
    success: true,
    data: stickers
  });
});

/**
 * 자신의 스티커 통계 조회 (자녀용)
 * @route GET /api/stickers/stats
 */
export const getChildStickerStats = asyncHandler(async (req: any, res: any) => {
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
 * 스티커 상세 조회
 * @route GET /api/stickers/:id
 */
export const getStickerById = asyncHandler(async (req: any, res: any) => {
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