import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';
import { UserType } from '@prisma/client';

/**
 * 프로필 정보 조회
 */
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      userType: true,
      profileImage: true,
      createdAt: true,
      parentProfile: {
        select: {
          id: true,
          children: {
            select: {
              child: {
                select: {
                  id: true,
                  user: {
                    select: {
                      username: true,
                      profileImage: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      childProfile: {
        select: {
          id: true,
          birthDate: true,
          characterStage: true,
          parents: {
            select: {
              parent: {
                select: {
                  id: true,
                  user: {
                    select: {
                      username: true,
                      profileImage: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  return user;
};

/**
 * 프로필 정보 업데이트
 */
export const updateUserProfile = async (
  userId: string,
  updateData: {
    username?: string;
    email?: string;
    birthDate?: Date | null;
  }
) => {
  // 사용자 존재 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      childProfile: true
    }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 이메일 중복 확인
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: updateData.email,
        id: { not: userId }
      }
    });

    if (existingUser) {
      throw new ApiError('이미 사용 중인 이메일입니다.', 400);
    }
  }

  // 트랜잭션으로 프로필 업데이트
  return await prisma.$transaction(async (prisma) => {
    // 사용자 기본 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: updateData.username || undefined,
        email: updateData.email || undefined
      },
      select: {
        id: true,
        username: true,
        email: true,
        userType: true,
        profileImage: true,
        createdAt: true
      }
    });

    // 자녀인 경우 생일 정보 업데이트
    if (user.userType === UserType.CHILD && user.childProfile && 'birthDate' in updateData) {
      await prisma.childProfile.update({
        where: { id: user.childProfile.id },
        data: {
          birthDate: updateData.birthDate
        }
      });
    }

    return updatedUser;
  });
};

/**
 * 프로필 이미지 업데이트
 */
export const updateProfileImage = async (userId: string, imageUrl: string) => {
  // 사용자 존재 확인
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 프로필 이미지 업데이트
  return await prisma.user.update({
    where: { id: userId },
    data: {
      profileImage: imageUrl
    },
    select: {
      id: true,
      username: true,
      profileImage: true
    }
  });
};

/**
 * 자녀 목록 조회 (부모용)
 */
export const getParentChildren = async (userId: string) => {
  // 부모 프로필 확인
  const parentProfile = await prisma.parentProfile.findFirst({
    where: {
      user: {
        id: userId
      }
    }
  });

  if (!parentProfile) {
    throw new ApiError('부모 프로필을 찾을 수 없습니다.', 404);
  }

  // 자녀 목록 조회
  return await prisma.childParentConnection.findMany({
    where: {
      parentId: parentProfile.id
    },
    include: {
      child: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profileImage: true
            }
          }
        }
      }
    }
  });
};

/**
 * 부모 목록 조회 (자녀용)
 */
export const getChildParents = async (userId: string) => {
  // 자녀 프로필 확인
  const childProfile = await prisma.childProfile.findFirst({
    where: {
      user: {
        id: userId
      }
    }
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  // 부모 목록 조회
  return await prisma.childParentConnection.findMany({
    where: {
      childId: childProfile.id
    },
    include: {
      parent: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profileImage: true,
              email: true
            }
          }
        }
      }
    }
  });
};

/**
 * 사용자 상세 정보 조회 (부모/자녀 관계 필요)
 */
export const getUserById = async (targetUserId: string, requesterId: string) => {
  // 요청자 확인
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    include: {
      parentProfile: true,
      childProfile: true
    }
  });

  if (!requester) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 대상 사용자 확인
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      parentProfile: true,
      childProfile: true
    }
  });

  if (!targetUser) {
    throw new ApiError('대상 사용자를 찾을 수 없습니다.', 404);
  }

  // 관계 확인 (부모가 자녀 정보를 조회하거나, 자녀가 부모 정보를 조회하는 경우)
  let hasRelationship = false;

  if (requester.userType === UserType.PARENT && targetUser.userType === UserType.CHILD) {
    // 부모가 자녀 정보를 조회하는 경우
    if (requester.parentProfile && targetUser.childProfile) {
      const connection = await prisma.childParentConnection.findFirst({
        where: {
          parentId: requester.parentProfile.id,
          childId: targetUser.childProfile.id
        }
      });
      hasRelationship = !!connection;
    }
  } else if (requester.userType === UserType.CHILD && targetUser.userType === UserType.PARENT) {
    // 자녀가 부모 정보를 조회하는 경우
    if (requester.childProfile && targetUser.parentProfile) {
      const connection = await prisma.childParentConnection.findFirst({
        where: {
          childId: requester.childProfile.id,
          parentId: targetUser.parentProfile.id
        }
      });
      hasRelationship = !!connection;
    }
  } else if (requester.id === targetUser.id) {
    // 자신의 정보를 조회하는 경우
    hasRelationship = true;
  }

  if (!hasRelationship) {
    throw new ApiError('이 사용자의 정보를 조회할 권한이 없습니다.', 403);
  }

  // 상세 정보 조회
  return await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      username: true,
      email: true,
      userType: true,
      profileImage: true,
      createdAt: true,
      parentProfile: targetUser.userType === UserType.PARENT ? {
        select: {
          id: true
        }
      } : undefined,
      childProfile: targetUser.userType === UserType.CHILD ? {
        select: {
          id: true,
          birthDate: true,
          characterStage: true
        }
      } : undefined
    }
  });
};