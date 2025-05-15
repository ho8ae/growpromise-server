import Joi from 'joi';

// 새 식물 시작하기 유효성 검사 스키마
export const startPlantSchema = Joi.object({
  plantTypeId: Joi.string().required().messages({
    'string.empty': '식물 유형 ID는 필수입니다.',
    'any.required': '식물 유형 ID는 필수입니다.'
  }),
  plantName: Joi.string().max(30).messages({
    'string.max': '식물 이름은 최대 30자까지 가능합니다.'
  })
});

// 식물 유형 생성 유효성 검사 스키마
export const plantTypeSchema = Joi.object({
  name: Joi.string().required().max(50).messages({
    'string.empty': '식물 이름은 필수입니다.',
    'string.max': '식물 이름은 최대 50자까지 가능합니다.',
    'any.required': '식물 이름은 필수입니다.'
  }),
  description: Joi.string().max(500).messages({
    'string.max': '설명은 최대 500자까지 가능합니다.'
  }),
  growthStages: Joi.number().integer().min(1).max(10).required().messages({
    'number.base': '성장 단계는 숫자여야 합니다.',
    'number.integer': '성장 단계는 정수여야 합니다.',
    'number.min': '성장 단계는 최소 1단계 이상이어야 합니다.',
    'number.max': '성장 단계는 최대 10단계까지 가능합니다.',
    'any.required': '성장 단계는 필수입니다.'
  }),
  difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD').required().messages({
    'string.empty': '난이도는 필수입니다.',
    'any.only': '난이도는 EASY, MEDIUM, HARD 중 하나여야 합니다.',
    'any.required': '난이도는 필수입니다.'
  }),
  category: Joi.string().valid('FLOWER', 'TREE', 'VEGETABLE', 'FRUIT', 'OTHER').required().messages({
    'string.empty': '카테고리는 필수입니다.',
    'any.only': '카테고리는 FLOWER, TREE, VEGETABLE, FRUIT, OTHER 중 하나여야 합니다.',
    'any.required': '카테고리는 필수입니다.'
  }),
  unlockRequirement: Joi.number().integer().min(0).messages({
    'number.base': '잠금 해제 요구 사항은 숫자여야 합니다.',
    'number.integer': '잠금 해제 요구 사항은 정수여야 합니다.',
    'number.min': '잠금 해제 요구 사항은 0 이상이어야 합니다.'
  }),
  imagePrefix: Joi.string().required().messages({
    'string.empty': '이미지 접두사는 필수입니다.',
    'any.required': '이미지 접두사는 필수입니다.'
  })
});

// 물주기 유효성 검사 스키마
export const waterPlantSchema = Joi.object({
  plantId: Joi.string().required().messages({
    'string.empty': '식물 ID는 필수입니다.',
    'any.required': '식물 ID는 필수입니다.'
  })
});

// 성장 단계 올리기 유효성 검사 스키마
export const growPlantSchema = Joi.object({
  plantId: Joi.string().required().messages({
    'string.empty': '식물 ID는 필수입니다.',
    'any.required': '식물 ID는 필수입니다.'
  })
});

// 식물 뽑기 유효성 검사 스키마
export const drawPlantSchema = Joi.object({
  packType: Joi.string().valid('BASIC', 'PREMIUM', 'SPECIAL').required().messages({
    'string.empty': '팩 타입은 필수입니다.',
    'any.only': '팩 타입은 BASIC, PREMIUM, SPECIAL 중 하나여야 합니다.',
    'any.required': '팩 타입은 필수입니다.'
  })
});