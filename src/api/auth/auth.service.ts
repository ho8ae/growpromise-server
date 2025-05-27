import { prisma } from '../../app';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiError } from '../../middleware/error.middleware';
import { UserType } from '@prisma/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

import { SocialProvider } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';



// Google OAuth 클라이언트 초기화
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Google ID 토큰 검증 (개선된 버전)
 */
const verifyGoogleToken = async (idToken: string) => {
  try {
    console.log('🔍 Google 토큰 검증 시작...');
    console.log('- Client ID:', process.env.GOOGLE_CLIENT_ID ? '✅ 설정됨' : '❌ 없음');
    console.log('- Token 길이:', idToken.length);
    
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new ApiError('Invalid Google token payload', 400);
    }

    console.log('✅ Google 토큰 검증 성공:', {
      sub: payload.sub,
      email: payload.email,
      name: payload.name
    });

    return {
      socialId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split('@')[0] || 'User',
      profileImage: payload.picture
    };
  } catch (error: any) {
    console.error('❌ Google 토큰 검증 실패:', error.message);
    throw new ApiError('Google token verification failed', 400);
  }
};

/**
 * Apple ID 토큰 간단 검증 (Base64 디코딩만)
 */
const verifyAppleToken = async (idToken: string, userInfo?: any) => {
  try {
    // JWT의 payload 부분만 Base64 디코딩
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    return {
      socialId: payload.sub,
      email: payload.email || userInfo?.email,
      name: userInfo?.fullName?.givenName || userInfo?.email?.split('@')[0] || 'User'
    };
  } catch (error) {
    throw new ApiError('Apple token verification failed', 400);
  }
};


/**
 * 소셜 로그인 - 1단계 (최소 정보로 계정 생성)
 */
export const socialSignIn = async (
  provider: 'GOOGLE' | 'APPLE',
  idToken: string,
  userInfo?: any // Apple의 경우 추가 정보
) => {
  let socialData;
  
  // 토큰 검증
  if (provider === 'GOOGLE') {
    socialData = await verifyGoogleToken(idToken);
  } else {
    socialData = await verifyAppleToken(idToken, userInfo);
  }

  // 기존 사용자 찾기
  let existingUser = await prisma.user.findFirst({
    where: {
      socialProvider: provider as SocialProvider,
      socialId: socialData.socialId
    }
  });

  // 이메일로도 확인 (기존 일반 계정과 연동)
  if (!existingUser && socialData.email) {
    existingUser = await prisma.user.findUnique({
      where: { email: socialData.email }
    });

    // 기존 계정을 소셜 계정으로 연동
    if (existingUser && !existingUser.socialProvider) {
      existingUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          socialProvider: provider as SocialProvider,
          socialId: socialData.socialId,
          // profileImage: socialData.profileImage || existingUser.profileImage 
        }
      });
    }
  }

  // 기존 사용자가 있으면 로그인 처리
  if (existingUser) {
    const token = generateToken(existingUser.id, existingUser.userType);

    return {
      user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        userType: existingUser.userType,
        setupCompleted: existingUser.setupCompleted,
        isNewUser: false
      },
      token,
      needsSetup: !existingUser.setupCompleted
    };
  }

  // 새 사용자 생성 (최소 정보만으로)
  const newUser = await prisma.user.create({
    data: {
      email: socialData.email,
      username: socialData.name,
      password: null, // 소셜 로그인은 비밀번호 없음
      userType: 'PARENT', // 기본값, 나중에 설정에서 변경 가능
      socialProvider: provider as SocialProvider,
      socialId: socialData.socialId,
      // profileImage: socialData.profileImage,
      setupCompleted: false // 초기 설정 필요
    }
  });

  const token = generateToken(newUser.id, newUser.userType);

  return {
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      userType: newUser.userType,
      setupCompleted: false,
      isNewUser: true
    },
    token,
    needsSetup: true
  };
};

/**
 * 소셜 로그인 - 2단계 (사용자 타입 및 프로필 설정)
 */
export const completeSocialSetup = async (
  userId: string,
  userType: 'PARENT' | 'CHILD',
  setupData: {
    birthDate?: Date;
    parentCode?: string;
  } = {}
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  if (user.setupCompleted) {
    throw new ApiError('이미 설정이 완료된 계정입니다.', 400);
  }

  const result = await prisma.$transaction(async (prisma) => {
    // 사용자 타입 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        userType: userType as UserType,
        setupCompleted: true
      }
    });

    let profileId = '';

    // 프로필 생성
    if (userType === 'PARENT') {
      // 연결 코드 생성
      let connectionCode = generateRandomCode();
      let existingCode = await prisma.parentProfile.findFirst({
        where: { connectionCode }
      });
      
      while (existingCode) {
        connectionCode = generateRandomCode();
        existingCode = await prisma.parentProfile.findFirst({
          where: { connectionCode }
        });
      }

      const parentProfile = await prisma.parentProfile.create({
        data: {
          userId: user.id,
          connectionCode,
          connectionCodeExpires: new Date(Date.now() + 5 * 60 * 1000)
        }
      });
      
      profileId = parentProfile.id;
    } else {
      const childProfile = await prisma.childProfile.create({
        data: {
          userId: user.id,
          birthDate: setupData.birthDate || null,
          characterStage: 1,
          totalCompletedPlants: 0,
          wateringStreak: 0
        }
      });

      profileId = childProfile.id;

      // 부모 코드가 있는 경우 연결
      if (setupData.parentCode) {
        const parentProfile = await prisma.parentProfile.findFirst({
          where: {
            connectionCode: setupData.parentCode,
            connectionCodeExpires: { gt: new Date() }
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
    }

    return { user: updatedUser, profileId };
  });

  const token = generateToken(result.user.id, result.user.userType, result.profileId);

  return {
    user: {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
      userType: result.user.userType,
      profileId: result.profileId,
      setupCompleted: true
    },
    token
  };
};


/**
 * 소셜 계정에 비밀번호 설정
 */
export const setSocialAccountPassword = async (
  userId: string,
  newPassword: string
) => {
  // 사용자 조회
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isActive: true
    }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 소셜 로그인 사용자만 비밀번호 설정 가능
  if (!user.socialProvider) {
    throw new ApiError('일반 로그인 사용자는 이 기능을 사용할 수 없습니다.', 400);
  }

  // 이미 비밀번호가 설정된 경우
  if (user.password) {
    throw new ApiError('이미 비밀번호가 설정되어 있습니다.', 400);
  }

  // 새 비밀번호 해싱
  const hashedPassword = await hashPassword(newPassword);

  // 비밀번호 설정
  await prisma.user.update({
    where: { id: userId },
    data: { 
      password: hashedPassword,
      updatedAt: new Date()
    }
  });

  return {
    message: '비밀번호가 성공적으로 설정되었습니다.'
  };
};

/**
 * 계정 비활성화 (소프트 삭제)
 */
export const deactivateAccount = async (
  userId: string,
  password?: string
) => {
  // 사용자 조회
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isActive: true
    }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 일반 로그인 사용자인 경우 비밀번호 확인
  if (!user.socialProvider && user.password) {
    if (!password) {
      throw new ApiError('비밀번호 확인이 필요합니다.', 400);
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('비밀번호가 일치하지 않습니다.', 401);
    }
  }

  // 계정 비활성화 (username에 삭제 시간 추가로 중복 방지)
  const deletedUsername = `${user.username}_deleted_${Date.now()}`;
  const deletedEmail = user.email ? `${user.email}_deleted_${Date.now()}` : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      username: deletedUsername,
      email: deletedEmail,
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date()
    }
  });

  return {
    message: '계정이 성공적으로 비활성화되었습니다.'
  };
};

/**
 * 계정 완전 삭제
 */
export const deleteAccount = async (
  userId: string,
  password?: string
) => {
  // 사용자 조회
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isActive: true
    }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 일반 로그인 사용자인 경우 비밀번호 확인
  if (!user.socialProvider && user.password) {
    if (!password) {
      throw new ApiError('비밀번호 확인이 필요합니다.', 400);
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('비밀번호가 일치하지 않습니다.', 401);
    }
  }

  // 계정 완전 삭제 (CASCADE로 관련 데이터도 자동 삭제됨)
  await prisma.user.delete({
    where: { id: userId }
  });

  return {
    message: '계정이 완전히 삭제되었습니다.'
  };
};

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
  const isPasswordValid = await verifyPassword(password, user.password || '');
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
  const isPasswordValid = await verifyPassword(currentPassword, user.password || '');
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