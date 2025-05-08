import Joi from 'joi';

// 약속 생성 유효성 검사 스키마
export const createPromiseSchema = Joi.object({
  title: Joi.string().required().max(100).messages({
    'string.empty': '약속 제목은 필수입니다.',
    'string.max': '약속 제목은 최대 100자까지 가능합니다.',
    'any.required': '약속 제목은 필수입니다.'
  }),
  description: Joi.string().max(500).allow('').messages({
    'string.max': '약속 설명은 최대 500자까지 가능합니다.'
  }),
  repeatType: Joi.string().valid('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY').default('ONCE').messages({
    'any.only': '반복 유형은 ONCE, DAILY, WEEKLY, MONTHLY만 가능합니다.'
  }),
  startDate: Joi.date().iso().required().messages({
    'date.base': '시작일은 유효한 날짜 형식이어야 합니다.',
    'date.format': '시작일은 YYYY-MM-DD 형식이어야 합니다.',
    'any.required': '시작일은 필수입니다.'
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null).messages({
    'date.base': '종료일은 유효한 날짜 형식이어야 합니다.',
    'date.format': '종료일은 YYYY-MM-DD 형식이어야 합니다.',
    'date.min': '종료일은 시작일 이후여야 합니다.'
  }),
  childIds: Joi.array().items(Joi.string().required()).min(1).required().messages({
    'array.base': '자녀 ID는 배열이어야 합니다.',
    'array.min': '적어도 한 명의 자녀를 선택해야 합니다.',
    'any.required': '자녀 ID는 필수입니다.'
  })
});

// 약속 업데이트 유효성 검사 스키마
export const updatePromiseSchema = Joi.object({
  title: Joi.string().max(100).messages({
    'string.max': '약속 제목은 최대 100자까지 가능합니다.'
  }),
  description: Joi.string().max(500).allow('').messages({
    'string.max': '약속 설명은 최대 500자까지 가능합니다.'
  }),
  repeatType: Joi.string().valid('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY').messages({
    'any.only': '반복 유형은 ONCE, DAILY, WEEKLY, MONTHLY만 가능합니다.'
  }),
  startDate: Joi.date().iso().messages({
    'date.base': '시작일은 유효한 날짜 형식이어야 합니다.',
    'date.format': '시작일은 YYYY-MM-DD 형식이어야 합니다.'
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null).messages({
    'date.base': '종료일은 유효한 날짜 형식이어야 합니다.',
    'date.format': '종료일은 YYYY-MM-DD 형식이어야 합니다.',
    'date.min': '종료일은 시작일 이후여야 합니다.'
  }),
  childIds: Joi.array().items(Joi.string().required()).min(1).messages({
    'array.base': '자녀 ID는 배열이어야 합니다.',
    'array.min': '적어도 한 명의 자녀를 선택해야 합니다.'
  })
}).min(1); // 적어도 하나의 필드는 있어야 함

// 약속 인증 제출 유효성 검사 스키마
export const submitVerificationSchema = Joi.object({
  promiseAssignmentId: Joi.string().required().messages({
    'string.empty': '약속 할당 ID는 필수입니다.',
    'any.required': '약속 할당 ID는 필수입니다.'
  })
});

// 약속 인증 승인/거절 유효성 검사 스키마
export const responseVerificationSchema = Joi.object({
  approved: Joi.boolean().required().messages({
    'boolean.base': '승인 여부는 불리언 값이어야 합니다.',
    'any.required': '승인 여부는 필수입니다.'
  }),
  rejectionReason: Joi.when('approved', {
    is: false,
    then: Joi.string().required().messages({
      'string.empty': '거절 사유는 필수입니다.',
      'any.required': '거절 사유는 필수입니다.'
    }),
    otherwise: Joi.string().allow('').optional()
  })
});