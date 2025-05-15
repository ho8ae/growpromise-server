import { prisma } from '../../app';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiError } from '../../middleware/error.middleware';
import { UserType } from '@prisma/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
export const generateToken = (userId: string, userType: string, profileId?: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key';
  
  return jwt.sign(
    { userId, userType, profileId },
    secret,
    { expiresIn: '7d' }
  );
};

/**
 * 6자리 랜덤 숫자 코드 생성
 */
export const generateRandomCode = (): string => {
  // 6자리 랜덤 숫자 생성 (100000~999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 이메일 전송 함수
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  // 개발 환경을 위한 테스트 SMTP 설정
  // 실제 환경에서는 환경변수로 설정
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
      user: process.env.SMTP_USER || 'your-mailtrap-user',
      pass: process.env.SMTP_PASS || 'your-mailtrap-password'
    }
  });

  // 이메일 전송
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '쑥쑥약속 <noreply@growpromise.com>',
    to,
    subject,
    html
  });
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

    // 연결 코드 생성 (중복 확인)
    let connectionCode = generateRandomCode();
    let existingCode = await prisma.parentProfile.findFirst({
      where: { connectionCode }
    });
    
    // 중복된 코드가 있으면 다시 생성
    while (existingCode) {
      connectionCode = generateRandomCode();
      existingCode = await prisma.parentProfile.findFirst({
        where: { connectionCode }
      });
    }

    // 부모 프로필 생성 (연결 코드 포함)
    const parentProfile = await prisma.parentProfile.create({
      data: {
        userId: user.id,
        connectionCode, // 연결 코드 저장
        connectionCodeExpires: new Date(Date.now() + 5 * 60 * 1000) // 5분 후 만료
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
        birthDate: birthDate || null,
        characterStage: 1,
        totalCompletedPlants: 0,  // 추가된 필드
        wateringStreak: 0,        // 추가된 필드
      }
    });

    // 부모 코드가 있는 경우 부모와 연결
    if (parentCode) {
      const parentProfile = await prisma.parentProfile.findFirst({
        where: {
          connectionCode: parentCode,
          connectionCodeExpires: {
            gt: new Date() // 만료되지 않은 코드만
          }
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
  // userType: 'PARENT' | 'CHILD'
) => {
  // 사용자 찾기
  const user = await prisma.user.findFirst({
    where: {
      username,
    }
  });

  const userType = user?.userType;

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

  // 토큰 생성 (profileId 포함)
  const token = generateToken(user.id, user.userType, profileId);

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

  // 새로운 연결 코드 생성
  const connectionCode = generateRandomCode();
  
  // 만료 시간 설정 (5분)
  const connectionCodeExpires = new Date(Date.now() + 5 * 60 * 1000);
  
  // 프로필 업데이트
  await prisma.parentProfile.update({
    where: { id: parentProfile.id },
    data: {
      connectionCode,
      connectionCodeExpires
    }
  });

  return {
    code: connectionCode,
    expiresAt: connectionCodeExpires
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

  // 부모 프로필 조회 (유효한 연결 코드로)
  const parentProfile = await prisma.parentProfile.findFirst({
    where: {
      connectionCode: parentCode,
      connectionCodeExpires: {
        gt: new Date() // 만료되지 않은 코드만
      }
    }
  });

  if (!parentProfile) {
    throw new ApiError('유효하지 않거나 만료된 부모 연결 코드입니다.', 400);
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

/**
 * 아이디 찾기 (이메일로 아이디 찾기)
 */
export const findUsername = async (email: string) => {
  // 이메일로 사용자 찾기
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new ApiError('해당 이메일로 등록된 사용자가 없습니다.', 404);
  }

  // 아이디 정보 반환
  return {
    username: user.username,
    userType: user.userType,
    message: '아이디를 찾았습니다.'
  };
};

/**
 * 비밀번호 재설정 토큰 생성
 */
export const generatePasswordResetToken = async (email: string) => {
  // 이메일로 사용자 찾기
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new ApiError('해당 이메일로 등록된 사용자가 없습니다.', 404);
  }

  // 랜덤 토큰 생성
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // 토큰 해싱
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 토큰 만료 시간 (10분)
  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  // 사용자 정보 업데이트
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken,
      passwordResetExpires
    }
  });

  // 비밀번호 재설정 이메일 전송
  const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${process.env.LOGO_URL || 'https://growpromise.com/logo.png'}" alt="쑥쑥약속 로고" style="width: 100px;">
      </div>
      <h2 style="color: #4CAF50; text-align: center;">비밀번호 재설정</h2>
      <p>안녕하세요, ${user.username}님!</p>
      <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정하세요.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetURL}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">비밀번호 재설정</a>
      </div>
      <p>이 링크는 10분 동안만 유효합니다.</p>
      <p>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시해 주세요.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
        <p>쑥쑥약속 팀 드림</p>
      </div>
    </div>
  `;

  try {
    await sendEmail(user.email || '', '[쑥쑥약속] 비밀번호 재설정', emailHtml);
    
    return {
      message: '비밀번호 재설정 이메일이 전송되었습니다.'
    };
  } catch (error) {
    // 이메일 전송 실패 시 토큰 삭제
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });
    
    throw new ApiError('이메일 전송에 실패했습니다.', 500);
  }
};

/**
 * 비밀번호 재설정
 */
export const resetPassword = async (resetToken: string, newPassword: string) => {
  // 토큰 해싱
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 토큰으로 사용자 찾기
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        gt: new Date() // 만료되지 않은 토큰만
      }
    }
  });

  if (!user) {
    throw new ApiError('토큰이 유효하지 않거나 만료되었습니다.', 400);
  }

  // 새 비밀번호 해싱
  const hashedPassword = await hashPassword(newPassword);

  // 비밀번호 업데이트 및 토큰 삭제
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    }
  });

  return {
    message: '비밀번호가 성공적으로 재설정되었습니다.'
  };
};