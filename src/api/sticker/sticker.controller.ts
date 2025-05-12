// src/api/sticker/sticker.controller.ts

import { asyncHandler } from '../../middleware/error.middleware';
import * as stickerService from './sticker.service';

const convertBigIntToNumber = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // BigInt인 경우 Number로 변환
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  // 배열인 경우 각 요소에 재귀 적용
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToNumber(item));
  }
  
  // 객체인 경우 각 프로퍼티에 재귀 적용
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertBigIntToNumber(obj[key]);
      }
    }
    return result;
  }
  
  // 그 외의 경우 그대로 반환
  return obj;
};

/**
 * 모든 스티커 템플릿 조회
 * @route GET /api/stickers/templates
 */
export const getAllStickerTemplates = asyncHandler(
  async (req: any, res: any) => {
    const templates = await stickerService.getAllStickerTemplates();

    res.status(200).json({
      success: true,
      data: templates,
    });
  },
);

/**
 * 카테고리별 스티커 템플릿 조회
 * @route GET /api/stickers/templates/category/:category
 */
export const getStickerTemplatesByCategory = asyncHandler(
  async (req: any, res: any) => {
    const { category } = req.params;

    const templates = await stickerService.getStickerTemplatesByCategory(
      category,
    );

    res.status(200).json({
      success: true,
      data: templates,
    });
  },
);

/**
 * 스티커 생성 (부모용)
 * @route POST /api/stickers
 */
export const createSticker = asyncHandler(async (req: any, res: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  const { title, description, childId, templateId } = req.body;

  const result = await stickerService.createSticker(
    req.user.id,
    childId,
    title,
    templateId,
    description,
  );

  res.status(201).json({
    success: true,
    message: '스티커가 성공적으로 생성되었습니다.',
    data: result,
  });
});

/**
 * 자녀의 스티커 목록 조회 (부모용)
 * @route GET /api/stickers/child/:childId
 */
export const getChildStickersByParent = asyncHandler(
  async (req: any, res: any) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { childId } = req.params;

    const stickers = await stickerService.getChildStickers(childId);

    res.status(200).json({
      success: true,
      data: stickers,
    });
  },
);

/**
 * 스티커 삭제
 * @route DELETE /api/stickers/:id
 */
export const deleteSticker = asyncHandler(async (req: any, res: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  const { id } = req.params;

  await stickerService.deleteSticker(id, req.user.id);

  res.status(200).json({
    success: true,
    message: '스티커가 성공적으로 삭제되었습니다.',
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
      message: '인증이 필요합니다.',
    });
  }

  const stickers = await stickerService.getChildStickersByUserId(req.user.id);

  res.status(200).json({
    success: true,
    data: stickers,
  });
});

/**
 * 자신의 스티커 통계 조회 (자녀용)
 * @route GET /api/stickers/stats
 */
export const getChildStickerStats = async (req: any, res: any, next: any) => {
  try {
    const stats = await stickerService.getChildStickerStats(req.user!.id);
    
    // BigInt를 포함한 모든 데이터를 안전하게 변환
    const safeStats = convertBigIntToNumber(stats);
    
    res.json({ success: true, data: safeStats });
  } catch (error) {
    console.error('스티커 통계 조회 오류:', error);
    res.json({ 
      success: true, 
      data: { 
        totalStickers: 0, 
        availableStickers: 0,
        monthlyStats: [] 
      } 
    });
  }
};

// 다른 컨트롤러에서도 동일하게 사용
export const getChildStickerCount = async (req: any, res: any, next: any) => {
  try {
    const { childId } = req.params;
    
    if (!childId) {
      return res.status(400).json({ success: false, message: '자녀 ID가 필요합니다.' });
    }
    
    const counts = await stickerService.getChildStickerCount(childId);
    
    // 변환
    const data = {
      totalStickers: Number(counts.totalStickers || 0),
      availableStickers: Number(counts.availableStickers || 0)
    };
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('자녀 스티커 개수 조회 오류:', error);
    res.json({ 
      success: true, 
      data: { 
        totalStickers: 0, 
        availableStickers: 0 
      } 
    });
  }
};


/**
 * 스티커 상세 조회
 * @route GET /api/stickers/:id
 */
export const getStickerById = asyncHandler(async (req: any, res: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  const { id } = req.params;

  const sticker = await stickerService.getStickerById(id, req.user.id);

  res.status(200).json({
    success: true,
    data: sticker,
  });
});
