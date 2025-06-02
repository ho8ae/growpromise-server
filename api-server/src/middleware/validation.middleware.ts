import { Request, Response, NextFunction } from 'express';
import { ApiError } from './error.middleware';

/**
 * 요청 데이터 유효성 검사 미들웨어
 * @param schema - 유효성 검사에 사용할 스키마
 * @param property - 검사할 요청 객체 속성 (body, query, params)
 */
export const validate = (schema: any, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[property];
    
    const { error } = schema.validate(data, { abortEarly: false });
    
    if (error) {
      const errorMessage = error.details
        .map((detail: any) => detail.message)
        .join(', ');
      
      throw new ApiError(errorMessage, 400);
    }
    
    next();
  };
};

/**
 * 기본 유효성 검사 함수
 */
export const validateRequired = (data: any, fields: string[]): string[] => {
  const missingFields = fields.filter(field => !data[field]);
  return missingFields;
};

/**
 * 이메일 형식 유효성 검사
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 강도 유효성 검사
 */
export const isStrongPassword = (password: string): boolean => {
  // 최소 8자, 최소 하나의 문자와 하나의 숫자
  return password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);
};

