import Joi from 'joi';

// 로그인 유효성 검사 스키마
export const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'string.empty': '사용자 이름은 필수입니다.',
    'any.required': '사용자 이름은 필수입니다.'
  }),
  password: Joi.string().required().messages({
    'string.empty': '비밀번호는 필수입니다.',
    'any.required': '비밀번호는 필수입니다.'
  }),
  // userType: Joi.string().valid('PARENT', 'CHILD').required().messages({
  //   'string.empty': '사용자 유형은 필수입니다.',
  //   'any.required': '사용자 유형은 필수입니다.',
  //   'any.only': '사용자 유형은 PARENT 또는 CHILD만 가능합니다.'
  // })
});

// 부모 회원가입 유효성 검사 스키마
export const parentSignupSchema = Joi.object({
  username: Joi.string().required().min(2).max(30).messages({
    'string.empty': '이름은 필수입니다.',
    'string.min': '이름은 최소 2자 이상이어야 합니다.',
    'string.max': '이름은 최대 30자까지 가능합니다.',
    'any.required': '이름은 필수입니다.'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': '이메일은 필수입니다.',
    'string.email': '유효한 이메일 형식이 아닙니다.',
    'any.required': '이메일은 필수입니다.'
  }),
  password: Joi.string().min(8).required().messages({
    'string.empty': '비밀번호는 필수입니다.',
    'string.min': '비밀번호는 최소 8자 이상이어야 합니다.',
    'any.required': '비밀번호는 필수입니다.'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'string.empty': '비밀번호 확인은 필수입니다.',
    'any.only': '비밀번호가 일치하지 않습니다.',
    'any.required': '비밀번호 확인은 필수입니다.'
  })
});

// 자녀 회원가입 유효성 검사 스키마
export const childSignupSchema = Joi.object({
  username: Joi.string().required().min(2).max(30).messages({
    'string.empty': '이름은 필수입니다.',
    'string.min': '이름은 최소 2자 이상이어야 합니다.',
    'string.max': '이름은 최대 30자까지 가능합니다.',
    'any.required': '이름은 필수입니다.'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': '비밀번호는 필수입니다.',
    'string.min': '비밀번호는 최소 6자 이상이어야 합니다.',
    'any.required': '비밀번호는 필수입니다.'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'string.empty': '비밀번호 확인은 필수입니다.',
    'any.only': '비밀번호가 일치하지 않습니다.',
    'any.required': '비밀번호 확인은 필수입니다.'
  }),
  birthDate: Joi.date().iso().messages({
    'date.base': '유효한 날짜 형식이 아닙니다.',
    'date.format': '날짜는 YYYY-MM-DD 형식이어야 합니다.'
  }),
  parentCode: Joi.string().messages({
    'string.empty': '부모 코드는 필수입니다.'
  })
});

// 비밀번호 변경 유효성 검사 스키마
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': '현재 비밀번호는 필수입니다.',
    'any.required': '현재 비밀번호는 필수입니다.'
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.empty': '새 비밀번호는 필수입니다.',
    'string.min': '새 비밀번호는 최소 8자 이상이어야 합니다.',
    'any.required': '새 비밀번호는 필수입니다.'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'string.empty': '비밀번호 확인은 필수입니다.',
    'any.only': '비밀번호가 일치하지 않습니다.',
    'any.required': '비밀번호 확인은 필수입니다.'
  })
});

// 아이디 찾기 유효성 검사 스키마 (추가)
export const findUsernameSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': '이메일은 필수입니다.',
    'string.email': '유효한 이메일 형식이 아닙니다.',
    'any.required': '이메일은 필수입니다.'
  })
});

// 비밀번호 재설정 요청 유효성 검사 스키마 (추가)
export const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': '이메일은 필수입니다.',
    'string.email': '유효한 이메일 형식이 아닙니다.',
    'any.required': '이메일은 필수입니다.'
  })
});

// 비밀번호 재설정 유효성 검사 스키마 (추가)
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': '토큰은 필수입니다.',
    'any.required': '토큰은 필수입니다.'
  }),
  password: Joi.string().min(8).required().messages({
    'string.empty': '새 비밀번호는 필수입니다.',
    'string.min': '새 비밀번호는 최소 8자 이상이어야 합니다.',
    'any.required': '새 비밀번호는 필수입니다.'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'string.empty': '비밀번호 확인은 필수입니다.',
    'any.only': '비밀번호가 일치하지 않습니다.',
    'any.required': '비밀번호 확인은 필수입니다.'
  })
});

// 소셜 로그인 1단계 유효성 검사 스키마 (수정)
export const socialSignInSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'string.empty': 'ID 토큰은 필수입니다.',
    'any.required': 'ID 토큰은 필수입니다.'
  }),
  userInfo: Joi.object().optional(), // Apple 로그인 시 추가 정보
  user: Joi.object().optional(),     // 추가: Google 사용자 정보
  serverAuthCode: Joi.string().optional(), // 추가: Google 서버 인증 코드
  scopes: Joi.array().optional()     // 추가: OAuth 스코프
});


// 소셜 로그인 2단계 설정 완료 유효성 검사 스키마
export const socialSetupSchema = Joi.object({
  userType: Joi.string().valid('PARENT', 'CHILD').required().messages({
    'string.empty': '사용자 타입은 필수입니다.',
    'any.required': '사용자 타입은 필수입니다.',
    'any.only': '사용자 타입은 PARENT 또는 CHILD만 가능합니다.'
  }),
  birthDate: Joi.date().iso().messages({
    'date.base': '유효한 날짜 형식이 아닙니다.',
    'date.format': '날짜는 YYYY-MM-DD 형식이어야 합니다.'
  }),
  parentCode: Joi.string().length(6).messages({
    'string.length': '부모 코드는 6자리여야 합니다.'
  })
});


// 소셜 계정 비밀번호 설정 유효성 검사 스키마
export const setSocialPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required().messages({
    'string.empty': '새 비밀번호는 필수입니다.',
    'string.min': '새 비밀번호는 최소 6자 이상이어야 합니다.',
    'any.required': '새 비밀번호는 필수입니다.'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'string.empty': '비밀번호 확인은 필수입니다.',
    'any.only': '비밀번호가 일치하지 않습니다.',
    'any.required': '비밀번호 확인은 필수입니다.'
  })
});

// 계정 삭제 유효성 검사 스키마
export const deleteAccountSchema = Joi.object({
  password: Joi.string().messages({
    'string.empty': '비밀번호를 입력해주세요.'
  }),
  confirmText: Joi.string().valid('DELETE', '삭제').messages({
    'any.only': '확인 텍스트가 일치하지 않습니다.'
  })
});
