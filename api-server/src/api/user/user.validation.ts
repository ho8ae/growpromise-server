import Joi from 'joi';

// 기본 프로필 업데이트 유효성 검사 스키마
export const updateProfileSchema = Joi.object({
  username: Joi.string().min(2).max(30).messages({
    'string.min': '이름은 최소 2자 이상이어야 합니다.',
    'string.max': '이름은 최대 30자까지 가능합니다.'
  }),
  email: Joi.string().email().messages({
    'string.email': '유효한 이메일 형식이 아닙니다.'
  }),
  birthDate: Joi.date().iso().allow(null).messages({
    'date.base': '생년월일은 유효한 날짜 형식이어야 합니다.',
    'date.format': '생년월일은 YYYY-MM-DD 형식이어야 합니다.'
  })
}).min(1); // 적어도 하나의 필드는 있어야 함

// 상세 프로필 업데이트 유효성 검사 스키마
export const updateDetailProfileSchema = Joi.object({
  username: Joi.string().min(2).max(30).messages({
    'string.min': '이름은 최소 2자 이상이어야 합니다.',
    'string.max': '이름은 최대 30자까지 가능합니다.'
  }),
  email: Joi.string().email().messages({
    'string.email': '유효한 이메일 형식이 아닙니다.'
  }),
  phoneNumber: Joi.string().pattern(/^[0-9-+()]+$/).messages({
    'string.pattern.base': '유효한 전화번호 형식이 아닙니다.'
  }),
  bio: Joi.string().max(300).messages({
    'string.max': '자기소개는 최대 300자까지 가능합니다.'
  }),
  birthDate: Joi.date().iso().allow(null).messages({
    'date.base': '생년월일은 유효한 날짜 형식이어야 합니다.',
    'date.format': '생년월일은 YYYY-MM-DD 형식이어야 합니다.'
  })
}).min(1); // 적어도 하나의 필드는 있어야 함

// 아바타 선택 유효성 검사 스키마
export const selectAvatarSchema = Joi.object({
  avatarId: Joi.string().valid(
    'avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5',
    'boy1', 'boy2', 'girl1', 'girl2', 'parent1', 'parent2'
  ).required().messages({
    'string.empty': '아바타 ID는 필수입니다.',
    'any.required': '아바타 ID는 필수입니다.',
    'any.only': '유효하지 않은 아바타 ID입니다.'
  })
});

// 사용자 조회 쿼리 유효성 검사 스키마
export const getUsersQuerySchema = Joi.object({
  userType: Joi.string().valid('PARENT', 'CHILD').messages({
    'any.only': '사용자 유형은 PARENT 또는 CHILD만 가능합니다.'
  }),
  search: Joi.string().messages({
    'string.base': '검색어는 문자열이어야 합니다.'
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

//  푸시 토큰 업데이트 유효성 검사 스키마
export const updatePushTokenSchema = Joi.object({
  expoPushToken: Joi.string().optional().messages({
    'string.base': 'Expo 푸시 토큰은 문자열이어야 합니다.'
  }),
  fcmToken: Joi.string().optional().messages({
    'string.base': 'FCM 토큰은 문자열이어야 합니다.'
  }),
  platform: Joi.string().valid('ios', 'android').required().messages({
    'string.base': '플랫폼은 문자열이어야 합니다.',
    'any.only': '플랫폼은 ios 또는 android여야 합니다.',
    'any.required': '플랫폼 정보가 필요합니다.'
  })
}).custom((value, helpers) => {
  const { expoPushToken, fcmToken, platform } = value;
  
  if (platform === 'ios' && !expoPushToken) {
    return helpers.error('custom.iosTokenRequired');
  }
  
  if (platform === 'android' && !fcmToken && !expoPushToken) {
    return helpers.error('custom.androidTokenRequired');
  }
  
  return value;
}).messages({
  'custom.iosTokenRequired': 'iOS에서는 Expo 푸시 토큰이 필요합니다.',
  'custom.androidTokenRequired': 'Android에서는 FCM 토큰 또는 Expo 토큰이 필요합니다.'
});

// 알림 설정 업데이트 유효성 검사 스키마
export const updateNotificationSettingsSchema = Joi.object({
  enabled: Joi.boolean().required().messages({
    'boolean.base': '알림 설정은 불리언 값이어야 합니다.',
    'any.required': '알림 설정은 필수입니다.'
  })
});

export const updatePushTokenLegacySchema = Joi.object({
  expoPushToken: Joi.string().required().messages({
    'string.base': '푸시 토큰은 문자열이어야 합니다.',
    'any.required': '푸시 토큰이 필요합니다.'
  })
});