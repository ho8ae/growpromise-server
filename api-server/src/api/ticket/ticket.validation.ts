// src/api/ticket/ticket.validation.ts
import Joi from 'joi';

// 티켓 사용 유효성 검사 스키마
export const useTicketSchema = Joi.object({
  ticketId: Joi.string().required().messages({
    'string.empty': '티켓 ID는 필수입니다.',
    'any.required': '티켓 ID는 필수입니다.'
  })
});

// 코인으로 뽑기 유효성 검사 스키마
export const drawWithCoinSchema = Joi.object({
  packType: Joi.string().valid('BASIC', 'PREMIUM', 'SPECIAL').required().messages({
    'string.empty': '팩 타입은 필수입니다.',
    'any.only': '팩 타입은 BASIC, PREMIUM, SPECIAL 중 하나여야 합니다.',
    'any.required': '팩 타입은 필수입니다.'
  })
});

// 관리자용 티켓 지급 유효성 검사 스키마
export const grantTicketSchema = Joi.object({
  childId: Joi.string().required().messages({
    'string.empty': '아이 ID는 필수입니다.',
    'any.required': '아이 ID는 필수입니다.'
  }),
  ticketType: Joi.string().valid('BASIC', 'PREMIUM', 'SPECIAL').required().messages({
    'string.empty': '티켓 타입은 필수입니다.',
    'any.only': '티켓 타입은 BASIC, PREMIUM, SPECIAL 중 하나여야 합니다.',
    'any.required': '티켓 타입은 필수입니다.'
  }),
  count: Joi.number().integer().min(1).max(100).required().messages({
    'number.base': '개수는 숫자여야 합니다.',
    'number.integer': '개수는 정수여야 합니다.',
    'number.min': '개수는 최소 1개 이상이어야 합니다.',
    'number.max': '개수는 최대 100개까지 가능합니다.',
    'any.required': '개수는 필수입니다.'
  }),
  reason: Joi.string().max(200).messages({
    'string.max': '사유는 최대 200자까지 가능합니다.'
  })
});

// 미션 생성 유효성 검사 스키마
export const createMissionSchema = Joi.object({
  childId: Joi.string().allow(null).messages({
    'string.empty': '아이 ID는 문자열이어야 합니다.'
  }),
  title: Joi.string().required().max(100).messages({
    'string.empty': '미션 제목은 필수입니다.',
    'string.max': '미션 제목은 최대 100자까지 가능합니다.',
    'any.required': '미션 제목은 필수입니다.'
  }),
  description: Joi.string().required().max(500).messages({
    'string.empty': '미션 설명은 필수입니다.',
    'string.max': '미션 설명은 최대 500자까지 가능합니다.',
    'any.required': '미션 설명은 필수입니다.'
  }),
  missionType: Joi.string().valid(
    'DAILY_VERIFICATION',
    'WEEKLY_VERIFICATION', 
    'MONTHLY_VERIFICATION',
    'PLANT_WATER',
    'PLANT_COMPLETION',
    'STREAK_MAINTENANCE'
  ).required().messages({
    'string.empty': '미션 타입은 필수입니다.',
    'any.only': '유효하지 않은 미션 타입입니다.',
    'any.required': '미션 타입은 필수입니다.'
  }),
  targetCount: Joi.number().integer().min(1).max(1000).required().messages({
    'number.base': '목표 카운트는 숫자여야 합니다.',
    'number.integer': '목표 카운트는 정수여야 합니다.',
    'number.min': '목표 카운트는 최소 1 이상이어야 합니다.',
    'number.max': '목표 카운트는 최대 1000까지 가능합니다.',
    'any.required': '목표 카운트는 필수입니다.'
  }),
  ticketReward: Joi.string().valid('BASIC', 'PREMIUM', 'SPECIAL').default('BASIC').messages({
    'any.only': '티켓 보상은 BASIC, PREMIUM, SPECIAL 중 하나여야 합니다.'
  }),
  ticketCount: Joi.number().integer().min(1).max(10).default(1).messages({
    'number.base': '티켓 개수는 숫자여야 합니다.',
    'number.integer': '티켓 개수는 정수여야 합니다.',
    'number.min': '티켓 개수는 최소 1개 이상이어야 합니다.',
    'number.max': '티켓 개수는 최대 10개까지 가능합니다.'
  }),
  endDate: Joi.date().iso().min('now').allow(null).messages({
    'date.base': '종료일은 유효한 날짜 형식이어야 합니다.',
    'date.format': '종료일은 YYYY-MM-DD 형식이어야 합니다.',
    'date.min': '종료일은 현재 시간 이후여야 합니다.'
  })
});

// 마일스톤 보상 생성 유효성 검사 스키마
export const createMilestoneRewardSchema = Joi.object({
  childId: Joi.string().allow(null).messages({
    'string.empty': '아이 ID는 문자열이어야 합니다.'
  }),
  rewardType: Joi.string().valid(
    'VERIFICATION_MILESTONE',
    'PLANT_COMPLETION',
    'DAILY_STREAK',
    'WEEKLY_MISSION',
    'MONTHLY_MISSION'
  ).required().messages({
    'string.empty': '보상 타입은 필수입니다.',
    'any.only': '유효하지 않은 보상 타입입니다.',
    'any.required': '보상 타입은 필수입니다.'
  }),
  requiredCount: Joi.number().integer().min(1).max(10000).required().messages({
    'number.base': '필요 카운트는 숫자여야 합니다.',
    'number.integer': '필요 카운트는 정수여야 합니다.',
    'number.min': '필요 카운트는 최소 1 이상이어야 합니다.',
    'number.max': '필요 카운트는 최대 10000까지 가능합니다.',
    'any.required': '필요 카운트는 필수입니다.'
  }),
  ticketType: Joi.string().valid('BASIC', 'PREMIUM', 'SPECIAL').default('BASIC').messages({
    'any.only': '티켓 타입은 BASIC, PREMIUM, SPECIAL 중 하나여야 합니다.'
  }),
  ticketCount: Joi.number().integer().min(1).max(10).default(1).messages({
    'number.base': '티켓 개수는 숫자여야 합니다.',
    'number.integer': '티켓 개수는 정수여야 합니다.',
    'number.min': '티켓 개수는 최소 1개 이상이어야 합니다.',
    'number.max': '티켓 개수는 최대 10개까지 가능합니다.'
  }),
  description: Joi.string().max(300).messages({
    'string.max': '설명은 최대 300자까지 가능합니다.'
  })
});