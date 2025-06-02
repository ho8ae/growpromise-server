import Joi from 'joi';

// 알림 조회 쿼리 유효성 검사 스키마
export const getNotificationsSchema = Joi.object({
  isRead: Joi.boolean().messages({
    'boolean.base': '읽음 상태는 불리언 값이어야 합니다.'
  }),
  limit: Joi.number().integer().min(1).max(100).messages({
    'number.base': '한계값은 숫자여야 합니다.',
    'number.integer': '한계값은 정수여야 합니다.',
    'number.min': '한계값은 최소 1 이상이어야 합니다.',
    'number.max': '한계값은 최대 100까지 가능합니다.'
  }),
  offset: Joi.number().integer().min(0).messages({
    'number.base': '오프셋은 숫자여야 합니다.',
    'number.integer': '오프셋은 정수여야 합니다.',
    'number.min': '오프셋은 0 이상이어야 합니다.'
  })
});

// 알림 읽음 상태 업데이트 유효성 검사 스키마
export const updateNotificationReadStatusSchema = Joi.object({
  isRead: Joi.boolean().required().messages({
    'boolean.base': '읽음 상태는 불리언 값이어야 합니다.',
    'any.required': '읽음 상태는 필수입니다.'
  })
});

// 알림 일괄 읽음 상태 업데이트 유효성 검사 스키마
export const updateMultipleNotificationsSchema = Joi.object({
  notificationIds: Joi.array().items(Joi.string().required()).min(1).required().messages({
    'array.base': '알림 ID는 배열이어야 합니다.',
    'array.min': '적어도 하나의 알림 ID가 필요합니다.',
    'any.required': '알림 ID는 필수입니다.'
  }),
  isRead: Joi.boolean().required().messages({
    'boolean.base': '읽음 상태는 불리언 값이어야 합니다.',
    'any.required': '읽음 상태는 필수입니다.'
  })
});