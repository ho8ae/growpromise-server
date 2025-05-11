import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';

// JWT 페이로드에 대한 타입 정의
interface JwtPayload {
  userId: string;
  userType: string;
  profileId?: string; // 프로필 ID 추가
}

// Request 인터페이스 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userType: string;
        profileId?: string; // 프로필 ID 추가
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
      return res.status(401).json({ 
        success: false,
        message: '인증이 필요합니다.' 
      });
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
      return res.status(401).json({ 
        success: false, 
        message: '유효하지 않은 사용자입니다.' 
      });
    }

    // 프로필 ID 조회
    let profileId: string | undefined = decoded.profileId;
    
    // 프로필 ID가 없다면 조회
    if (!profileId) {
      if (user.userType === 'PARENT') {
        const parentProfile = await prisma.parentProfile.findUnique({
          where: { userId: user.id }
        });
        profileId = parentProfile?.id;
      } else if (user.userType === 'CHILD') {
        const childProfile = await prisma.childProfile.findUnique({
          where: { userId: user.id }
        });
        profileId = childProfile?.id;
      }
    }

    // 요청 객체에 사용자 정보 추가
    req.user = {
      id: user.id,
      userType: user.userType,
      profileId
    };

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '유효하지 않은 인증 토큰입니다.' 
    });
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
    return res.status(401).json({ 
      success: false, 
      message: '인증이 필요합니다.' 
    });
  }

  if (req.user.userType !== 'PARENT') {
    return res.status(403).json({ 
      success: false, 
      message: '부모 권한이 필요합니다.' 
    });
  }

  next();
};

/**
 * 자녀 권한 확인 미들웨어 (추가)
 */
export const requireChild = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: '인증이 필요합니다.' 
    });
  }

  if (req.user.userType !== 'CHILD') {
    return res.status(403).json({ 
      success: false, 
      message: '자녀 권한이 필요합니다.' 
    });
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
    return res.status(401).json({ 
      success: false, 
      message: '인증이 필요합니다.' 
    });
  }

  if (req.user.userType !== 'PARENT' && req.user.userType !== 'CHILD') {
    return res.status(403).json({ 
      success: false, 
      message: '접근 권한이 없습니다.' 
    });
  }

  next();
};

/**
 * 부모-자녀 관계 확인 미들웨어 (추가)
 * 부모가 자녀에 대한 접근 권한이 있는지 확인
 */
export const checkParentChildRelationship = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '인증이 필요합니다.' 
      });
    }

    // 자녀는 자신의 데이터에만 접근 가능
    if (req.user.userType === 'CHILD') {
      // childId 파라미터가 있다면 자신의 ID와 비교
      const childId = req.params.childId || req.query.childId as string;
      if (childId && childId !== req.user.profileId) {
        return res.status(403).json({ 
          success: false, 
          message: '자신의 데이터만 접근할 수 있습니다.' 
        });
      }
      
      // 추가 검증 없이 통과
      return next();
    }

    // 부모인 경우 자녀와의 관계 확인
    if (req.user.userType === 'PARENT') {
      const childId = req.params.childId || req.query.childId as string;
      
      if (!childId) {
        return res.status(400).json({ 
          success: false, 
          message: '자녀 ID가 필요합니다.' 
        });
      }

      // 부모-자녀 관계 확인
      const connection = await prisma.childParentConnection.findFirst({
        where: {
          parentId: req.user.profileId,
          childId
        }
      });

      if (!connection) {
        return res.status(403).json({ 
          success: false, 
          message: '이 자녀에 대한 접근 권한이 없습니다.' 
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};