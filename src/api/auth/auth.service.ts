import { prisma } from '../../app';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiError } from '../../middleware/error.middleware';
import { UserType } from '@prisma/client';
import crypto from 'crypto';

/**
 * 비밀번호 해싱
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * 비밀번호 검증
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * JWT 토큰 생성
 */
export const generateToken = (userId: string, userType: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  
  return jwt.sign(
    { userId, userType },
    secret,
    { expiresIn: '7d' }
  );
};

/**
 * 부모 계정 생성
 */
export const createParentAccount = async (
  username: string,
  email: string,
  password: string
) => {
  // 이메일 중복 확인
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new ApiError('이미 사용 중인 이메일입니다.', 400);
  }

  // 비밀번호 해싱
  const hashedPassword = await hashPassword(password);

  // 트랜잭션으로 사용자와 부모 프로필 생성
  const result = await prisma.$transaction(async (prisma) => {
    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        userType: UserType.PARENT
      }
    });

    // 부모 프로필 생성
    const parentProfile = await prisma.parentProfile.create({
      data: {
        userId: user.id
      }
    });

    return {
      user,
      parentProfile
    };
  });

  return {
    id: result.user.id,
    email: result.user.email,
    username: result.user.username,
    userType: result.user.userType,
    parentProfileId: result.parentProfile.id
  };
};

/**
 * 자녀 계정 생성
 */
export const createChildAccount = async (
  username: string,
  password: string,
  birthDate?: Date,
  parentCode?: string
) => {
  // 비밀번호 해싱
  const hashedPassword = await hashPassword(password);

  // 트랜잭션으로 사용자와 자녀 프로필 생성
  const result = await prisma.$transaction(async (prisma) => {
    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        userType: UserType.CHILD
      }
    });

    // 자녀 프로필 생성
    const childProfile = await prisma.childProfile.create({
      data: {
        userId: user.id,
        birthDate: birthDate || null
      }
    });

    // 부모 코드가 있는 경우 부모와 연결
    if (parentCode) {
      const parentProfile = await prisma.parentProfile.findFirst({
        where: {
          id: parentCode
        }
      });

      if (parentProfile) {
        await prisma.childParentConnection.create({
          data: {
            childId: childProfile.id,
            parentId: parentProfile.id
          }
        });
      }
    }

    return {
      user,
      childProfile
    };
  });

  return {
    id: result.user.id,
    username: result.user.username,
    userType: result.user.userType,
    childProfileId: result.childProfile.id
  };
};

/**
 * 사용자 로그인
 */
export const loginUser = async (
  username: string,
  password: string,
  userType: 'PARENT' | 'CHILD'
) => {
  // 사용자 찾기
  const user = await prisma.user.findFirst({
    where: {
      username,
      userType: userType as UserType
    }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 비밀번호 검증
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError('비밀번호가 일치하지 않습니다.', 401);
  }

  // 프로필 정보 가져오기
  let profileId = '';
  
  if (userType === 'PARENT') {
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: user.id }
    });
    profileId = parentProfile?.id || '';
  } else {
    const childProfile = await prisma.childProfile.findUnique({
      where: { userId: user.id }
    });
    profileId = childProfile?.id || '';
  }

  // 토큰 생성
  const token = generateToken(user.id, user.userType);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      userType: user.userType,
      profileId
    },
    token
  };
};

/**
 * 부모 연결 코드 생성
 */
export const generateParentConnectionCode = async (parentId: string) => {
  // 부모 프로필 조회
  const parentProfile = await prisma.parentProfile.findFirst({
    where: {
      user: {
        id: parentId
      }
    }
  });

  if (!parentProfile) {
    throw new ApiError('부모 프로필을 찾을 수 없습니다.', 404);
  }

  return {
    code: parentProfile.id
  };
};

/**
 * 자녀 연결하기
 */
export const connectChildToParent = async (childId: string, parentCode: string) => {
  // 자녀 프로필 조회
  const childProfile = await prisma.childProfile.findFirst({
    where: {
      user: {
        id: childId
      }
    }
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  // 부모 프로필 조회
  const parentProfile = await prisma.parentProfile.findUnique({
    where: {
      id: parentCode
    }
  });

  if (!parentProfile) {
    throw new ApiError('유효하지 않은 부모 연결 코드입니다.', 400);
  }

  // 이미 연결되어 있는지 확인
  const existingConnection = await prisma.childParentConnection.findUnique({
    where: {
      childId_parentId: {
        childId: childProfile.id,
        parentId: parentProfile.id
      }
    }
  });

  if (existingConnection) {
    throw new ApiError('이미 이 부모와 연결되어 있습니다.', 400);
  }

  // 연결 생성
  await prisma.childParentConnection.create({
    data: {
      childId: childProfile.id,
      parentId: parentProfile.id
    }
  });

  return {
    message: '부모와 성공적으로 연결되었습니다.'
  };
};

/**
 * 비밀번호 변경
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  // 사용자 조회
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 현재 비밀번호 확인
  const isPasswordValid = await verifyPassword(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new ApiError('현재 비밀번호가 일치하지 않습니다.', 401);
  }

  // 새 비밀번호 해싱
  const hashedPassword = await hashPassword(newPassword);

  // 비밀번호 업데이트
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return {
    message: '비밀번호가 성공적으로 변경되었습니다.'
  };
};