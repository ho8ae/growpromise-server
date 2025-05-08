import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';

// JWT 페이로드에 대한 타입 정의
interface JwtPayload {
  userId: string;
  userType: string;
}

// Request 인터페이스 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userType: string;
      };
    }
  }
}

/**
 * JWT 토큰을 검증하고 사용자 정보를 request 객체에 추가하는 미들웨어
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }

    const token = authHeader.split(' ')[1];
    
    // 토큰 검증
    const secret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // 사용자 검증
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId
      }
    });

    if (!user) {
      return res.status(401).json({ message: '유효하지 않은 사용자입니다.' });
    }

    // 요청 객체에 사용자 정보 추가
    req.user = {
      id: user.id,
      userType: user.userType
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: '유효하지 않은 인증 토큰입니다.' });
  }
};

/**
 * 부모 권한 확인 미들웨어
 */
export const requireParent = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  if (req.user.userType !== 'PARENT') {
    return res.status(403).json({ message: '부모 권한이 필요합니다.' });
  }

  next();
};

/**
 * 부모 또는 자녀 권한 확인 미들웨어
 */
export const requireParentOrChild = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: '인증이 필요합니다.' });
  }

  if (req.user.userType !== 'PARENT' && req.user.userType !== 'CHILD') {
    return res.status(403).json({ message: '접근 권한이 없습니다.' });
  }

  next();
};