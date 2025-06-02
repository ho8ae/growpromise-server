import { Request, Response, NextFunction } from 'express';

// API 에러 클래스 정의
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 에러 처리 미들웨어
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('에러 발생:', error);

  // API 에러인 경우
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message
    });
  }

  // Prisma 에러 처리
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      message: '데이터베이스 요청 오류',
      error: error.message
    });
  }

  // JWT 관련 에러 처리
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: '유효하지 않은 토큰입니다.'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: '토큰이 만료되었습니다.'
    });
  }

  // 기타 처리되지 않은 에러
  return res.status(500).json({
    message: '서버 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'production' ? '세부 정보는 로그를 확인하세요.' : error.message
  });
};

// 비동기 핸들러 래퍼 함수
export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};