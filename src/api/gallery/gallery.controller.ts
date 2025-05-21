// src/api/gallery/gallery.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as galleryService from './gallery.service';

/**
 * 모든/특정 자녀의 갤러리 이미지 목록 조회 (부모용)
 * @route GET /api/gallery
 */
export const getParentGalleryImages = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { childId, favorite } = req.query;
    
    const favoriteBoolean = favorite === 'true';

    const images = await galleryService.getParentGalleryImages(
      req.user.id,
      childId as string | undefined,
      favorite ? favoriteBoolean : undefined
    );

    res.status(200).json({
      success: true,
      data: images,
    });
  }
);

/**
 * 자녀의 갤러리 이미지 목록 조회 (자녀용)
 * @route GET /api/gallery/child
 */
export const getChildGalleryImages = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { favorite } = req.query;
    const favoriteBoolean = favorite === 'true';

    const images = await galleryService.getChildGalleryImages(
      req.user.id,
      favorite ? favoriteBoolean : undefined
    );

    res.status(200).json({
      success: true,
      data: images,
    });
  }
);

/**
 * 갤러리 이미지 즐겨찾기 토글
 * @route PUT /api/gallery/:id/favorite
 */
export const toggleImageFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { id } = req.params;
    const { isFavorite } = req.body;

    if (typeof isFavorite !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '즐겨찾기 상태(isFavorite)는 boolean 값이어야 합니다.',
      });
    }

    const result = await galleryService.toggleImageFavorite(
      id,
      req.user.id,
      isFavorite
    );

    res.status(200).json({
      success: true,
      message: isFavorite ? '이미지를 즐겨찾기에 추가했습니다.' : '이미지를 즐겨찾기에서 제거했습니다.',
      data: result,
    });
  }
);

/**
 * 갤러리 이미지 삭제
 * @route DELETE /api/gallery/:id
 */
export const deleteGalleryImage = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { id } = req.params;

    await galleryService.deleteGalleryImage(id, req.user.id);

    res.status(200).json({
      success: true,
      message: '갤러리에서 이미지가 삭제되었습니다.',
    });
  }
);

/**
 * 갤러리 이미지 상세 조회
 * @route GET /api/gallery/:id
 */
export const getGalleryImageById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { id } = req.params;

    const image = await galleryService.getGalleryImageById(id, req.user.id);

    res.status(200).json({
      success: true,
      data: image,
    });
  }
);