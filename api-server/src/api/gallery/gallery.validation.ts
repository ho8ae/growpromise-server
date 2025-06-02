// src/api/gallery/gallery.validation.ts
import Joi from 'joi';

// 갤러리 이미지 즐겨찾기 토글 유효성 검사 스키마
export const toggleFavoriteSchema = Joi.object({
  isFavorite: Joi.boolean().required().messages({
    'boolean.base': '즐겨찾기 상태는 불리언 값이어야 합니다.',
    'any.required': '즐겨찾기 상태는 필수입니다.',
  }),
});