import Joi from 'joi';

// 보상 생성 유효성 검사 스키마
export const createRewardSchema = Joi.object({
  title: Joi.string().required().max(100).messages({
    'string.empty': '보상 제목은 필수입니다.',
    'string.max': '보상 제목은 최대 100자까지 가능합니다.',
    'any.required': '보상 제목은 필수입니다.'
  }),
  description: Joi.string().max(500).allow('').messages({
    'string.max': '보상 설명은 최대 500자까지 가능합니다.'
  }),
  requiredStickers: Joi.number().integer().min(1).required().messages({
    'number.base': '필요한 스티커 수는 숫자여야 합니다.',
    'number.integer': '필요한 스티커 수는 정수여야 합니다.',
    'number.min': '필요한 스티커 수는 최소 1개 이상이어야 합니다.',
    'any.required': '필요한 스티커 수는 필수입니다.'
  }),
  isActive: Joi.boolean().default(true).messages({
    'boolean.base': '활성화 여부는 불리언 값이어야 합니다.'
  })
});

// 보상 업데이트 유효성 검사 스키마
export const updateRewardSchema = Joi.object({
  title: Joi.string().max(100).messages({
    'string.max': '보상 제목은 최대 100자까지 가능합니다.'
  }),
  description: Joi.string().max(500).allow('').messages({
    'string.max': '보상 설명은 최대 500자까지 가능합니다.'
  }),
  requiredStickers: Joi.number().integer().min(1).messages({
    'number.base': '필요한 스티커 수는 숫자여야 합니다.',
    'number.integer': '필요한 스티커 수는 정수여야 합니다.',
    'number.min': '필요한 스티커 수는 최소 1개 이상이어야 합니다.'
  }),
  isActive: Joi.boolean().messages({
    'boolean.base': '활성화 여부는 불리언 값이어야 합니다.'
  })
}).min(1); // 적어도 하나의 필드는 있어야 함

// 보상 달성 유효성 검사 스키마
export const achieveRewardSchema = Joi.object({
  childId: Joi.string().required().messages({
    'string.empty': '자녀 ID는 필수입니다.',
    'any.required': '자녀 ID는 필수입니다.'
  })
});