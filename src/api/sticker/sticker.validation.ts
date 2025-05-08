import Joi from 'joi';

// 스티커 생성 유효성 검사 스키마
export const createStickerSchema = Joi.object({
  childId: Joi.string().required().messages({
    'string.empty': '자녀 ID는 필수입니다.',
    'any.required': '자녀 ID는 필수입니다.'
  }),
  title: Joi.string().required().max(50).messages({
    'string.empty': '스티커 제목은 필수입니다.',
    'string.max': '스티커 제목은 최대 50자까지 가능합니다.',
    'any.required': '스티커 제목은 필수입니다.'
  }),
  description: Joi.string().max(200).allow('').messages({
    'string.max': '스티커 설명은 최대 200자까지 가능합니다.'
  }),
  rewardId: Joi.string().allow(null).messages({
    'string.empty': '보상 ID는 필수입니다.'
  })
});

// 스티커 조회 (필터링) 유효성 검사 스키마
export const getStickerFilterSchema = Joi.object({
  childId: Joi.string().messages({
    'string.empty': '자녀 ID는 필수입니다.'
  }),
  rewardId: Joi.string().allow(null).messages({
    'string.empty': '보상 ID는 필수입니다.'
  })
});