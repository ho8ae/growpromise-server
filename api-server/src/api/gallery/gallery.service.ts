// src/api/gallery/gallery.service.ts
import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';
import { PromiseStatus } from '@prisma/client';

/**
 * 부모 프로필 ID 조회
 */
const getParentProfileId = async (userId: string): Promise<string> => {
  const parentProfile = await prisma.parentProfile.findFirst({
    where: {
      user: {
        id: userId,
      },
    },
  });

  if (!parentProfile) {
    throw new ApiError('부모 프로필을 찾을 수 없습니다.', 404);
  }

  return parentProfile.id;
};

/**
 * 자녀 프로필 ID 조회
 */
const getChildProfileId = async (userId: string): Promise<string> => {
  const childProfile = await prisma.childProfile.findFirst({
    where: {
      user: {
        id: userId,
      },
    },
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  return childProfile.id;
};

/**
 * 부모: 모든/특정 자녀의 인증 이미지 목록 조회
 */
export const getParentGalleryImages = async (
  userId: string,
  childId?: string,
  favorite?: boolean
) => {
  const parentProfileId = await getParentProfileId(userId);

  // 부모와 연결된 자녀 목록 조회
  const children = await prisma.childParentConnection.findMany({
    where: {
      parentId: parentProfileId,
    },
    select: {
      childId: true,
    },
  });

  const childIds = childId 
    ? [childId] 
    : children.map((child) => child.childId);

  // 자녀 ID 유효성 검증
  if (childId && !children.some(child => child.childId === childId)) {
    throw new ApiError('해당 자녀에 대한 접근 권한이 없습니다.', 403);
  }

  // 승인된 약속 인증 이미지 조회
  const whereClause: any = {
    childId: {
      in: childIds,
    },
    status: PromiseStatus.APPROVED,
    verificationImage: {
      not: null,
    },
    hiddenInGallery: false,
  };

  // 갤러리 정보 조회
  const galleryImages = await prisma.promiseAssignment.findMany({
    where: whereClause,
    include: {
      promise: {
        select: {
          id: true,
          title: true,
        },
      },
      child: {
        include: {
          user: {
            select: {
              username: true,
              profileImage: true,
            },
          },
        },
      },
      favorites: favorite ? {
        where: {
          userId,
        },
      } : undefined,
    },
    orderBy: {
      verificationTime: 'desc',
    },
  });

  // 응답 데이터 포맷팅
  return galleryImages.map((image) => {
    // 즐겨찾기 상태 확인 (favorite 쿼리가 있는 경우만)
    const isFavorite = favorite !== undefined
      ? favorite // favorite=true인 경우만 반환되므로 true
      : (image.favorites && image.favorites.length > 0);

    // favorite=true 필터링이 있는데 즐겨찾기가 없는 경우 건너뛰기
    if (favorite === true && !isFavorite) {
      return null;
    }

    return {
      id: image.id,
      promiseId: image.promiseId,
      promiseTitle: image.promise.title,
      imageUrl: image.verificationImage!,
      verificationTime: image.verificationTime!.toISOString(),
      childId: image.childId,
      childName: image.child.user.username,
      childProfileImage: image.child.user.profileImage || undefined,
      isFavorite: !!isFavorite,
    };
  }).filter(Boolean); // null 값 필터링
};

/**
 * 자녀: 자신의 인증 이미지 목록 조회
 */
export const getChildGalleryImages = async (
  userId: string,
  favorite?: boolean
) => {
  const childProfileId = await getChildProfileId(userId);

  // 승인된 약속 인증 이미지 조회
  const whereClause: any = {
    childId: childProfileId,
    status: PromiseStatus.APPROVED,
    verificationImage: {
      not: null,
    },
    hiddenInGallery: false,
  };

  // 갤러리 정보 조회
  const galleryImages = await prisma.promiseAssignment.findMany({
    where: whereClause,
    include: {
      promise: {
        select: {
          id: true,
          title: true,
        },
      },
      favorites: favorite ? {
        where: {
          userId,
        },
      } : undefined,
    },
    orderBy: {
      verificationTime: 'desc',
    },
  });

  // 응답 데이터 포맷팅
  return galleryImages.map((image) => {
    // 즐겨찾기 상태 확인 (favorite 쿼리가 있는 경우만)
    const isFavorite = favorite !== undefined
      ? favorite // favorite=true인 경우만 반환되므로 true
      : (image.favorites && image.favorites.length > 0);

    // favorite=true 필터링이 있는데 즐겨찾기가 없는 경우 건너뛰기
    if (favorite === true && !isFavorite) {
      return null;
    }

    return {
      id: image.id,
      promiseId: image.promiseId,
      promiseTitle: image.promise.title,
      imageUrl: image.verificationImage!,
      verificationTime: image.verificationTime!.toISOString(),
      childId: image.childId,
      childName: "", // 자녀 본인이므로 불필요
      isFavorite: !!isFavorite,
    };
  }).filter(Boolean); // null 값 필터링
};

/**
 * 갤러리 이미지 즐겨찾기 토글
 */
export const toggleImageFavorite = async (
  imageId: string,
  userId: string,
  isFavorite: boolean
) => {
  // 약속 할당 존재 확인
  const assignment = await prisma.promiseAssignment.findUnique({
    where: { id: imageId },
    include: {
      favorites: {
        where: { userId },
      },
    },
  });

  if (!assignment) {
    throw new ApiError('해당 이미지를 찾을 수 없습니다.', 404);
  }

  if (!assignment.verificationImage) {
    throw new ApiError('인증 이미지가 없는 약속입니다.', 400);
  }

  if (assignment.status !== PromiseStatus.APPROVED) {
    throw new ApiError('승인된 약속 이미지만 즐겨찾기할 수 있습니다.', 400);
  }

  // 현재 즐겨찾기 상태 확인
  const hasFavorite = assignment.favorites.length > 0;

  // 이미 원하는 상태이면 아무 작업도 하지 않음
  if (hasFavorite === isFavorite) {
    // 현재 상태 그대로 반환
    return {
      id: assignment.id,
      promiseId: assignment.promiseId,
      imageUrl: assignment.verificationImage,
      isFavorite,
    };
  }

  // 즐겨찾기 추가 또는 제거
  if (isFavorite) {
    // 즐겨찾기 추가
    await prisma.galleryFavorite.create({
      data: {
        userId,
        promiseAssignmentId: imageId,
      },
    });
  } else {
    // 즐겨찾기 제거
    await prisma.galleryFavorite.deleteMany({
      where: {
        userId,
        promiseAssignmentId: imageId,
      },
    });
  }

  // 업데이트된 약속 조회 및 응답
  const updatedAssignment = await prisma.promiseAssignment.findUnique({
    where: { id: imageId },
    include: {
      promise: {
        select: {
          title: true,
        },
      },
      child: {
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  if (!updatedAssignment) {
    throw new ApiError('업데이트 중 오류가 발생했습니다.', 500);
  }

  return {
    id: updatedAssignment.id,
    promiseId: updatedAssignment.promiseId,
    promiseTitle: updatedAssignment.promise.title,
    imageUrl: updatedAssignment.verificationImage!,
    verificationTime: updatedAssignment.verificationTime!.toISOString(),
    childId: updatedAssignment.childId,
    childName: updatedAssignment.child.user.username,
    isFavorite,
  };
};

/**
 * 갤러리 이미지 삭제 (소프트 삭제)
 */
export const deleteGalleryImage = async (imageId: string, userId: string) => {
  // 사용자 타입 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true },
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 약속 할당 존재 확인
  const assignment = await prisma.promiseAssignment.findUnique({
    where: { id: imageId },
    include: {
      promise: {
        select: {
          createdBy: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new ApiError('해당 이미지를 찾을 수 없습니다.', 404);
  }

  // 권한 확인
  if (user.userType === 'PARENT') {
    const parentProfileId = await getParentProfileId(userId);
    
    // 부모-자녀 관계 확인
    const hasRelationship = await prisma.childParentConnection.findFirst({
      where: {
        parentId: parentProfileId,
        childId: assignment.childId,
      },
    });

    if (!hasRelationship) {
      throw new ApiError('이 이미지를 삭제할 권한이 없습니다.', 403);
    }
  } else if (user.userType === 'CHILD') {
    const childProfileId = await getChildProfileId(userId);
    
    if (assignment.childId !== childProfileId) {
      throw new ApiError('이 이미지를 삭제할 권한이 없습니다.', 403);
    }
  }

  // 이미지는 유지하고 갤러리에서만 숨김 처리 (숨김 플래그 사용)
  await prisma.promiseAssignment.update({
    where: { id: imageId },
    data: {
      hiddenInGallery: true,
    },
  });

  return { success: true };
};

/**
 * 갤러리 이미지 상세 조회
 */
export const getGalleryImageById = async (imageId: string, userId: string) => {
  // 사용자 타입 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true },
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  // 약속 할당 존재 확인
  const assignment = await prisma.promiseAssignment.findUnique({
    where: { 
      id: imageId,
      hiddenInGallery: false, // 갤러리에서 숨겨지지 않은 이미지만
    },
    include: {
      promise: {
        select: {
          id: true,
          title: true,
          createdBy: true,
        },
      },
      child: {
        include: {
          user: {
            select: {
              username: true,
              profileImage: true,
            },
          },
        },
      },
      favorites: {
        where: { userId },
      },
    },
  });

  if (!assignment || !assignment.verificationImage) {
    throw new ApiError('해당 이미지를 찾을 수 없습니다.', 404);
  }

  // 권한 확인
  if (user.userType === 'PARENT') {
    const parentProfileId = await getParentProfileId(userId);
    
    // 부모-자녀 관계 확인
    const hasRelationship = await prisma.childParentConnection.findFirst({
      where: {
        parentId: parentProfileId,
        childId: assignment.childId,
      },
    });

    if (!hasRelationship) {
      throw new ApiError('이 이미지에 대한 접근 권한이 없습니다.', 403);
    }
  } else if (user.userType === 'CHILD') {
    const childProfileId = await getChildProfileId(userId);
    
    if (assignment.childId !== childProfileId) {
      throw new ApiError('이 이미지에 대한 접근 권한이 없습니다.', 403);
    }
  }

  // 즐겨찾기 상태 확인
  const isFavorite = assignment.favorites.length > 0;

  // 응답 데이터 포맷팅
  return {
    id: assignment.id,
    promiseId: assignment.promiseId,
    promiseTitle: assignment.promise.title,
    imageUrl: assignment.verificationImage,
    verificationTime: assignment.verificationTime!.toISOString(),
    childId: assignment.childId,
    childName: assignment.child.user.username,
    childProfileImage: assignment.child.user.profileImage || undefined,
    verificationDescription: assignment.verificationDescription || undefined,
    isFavorite,
  };
};