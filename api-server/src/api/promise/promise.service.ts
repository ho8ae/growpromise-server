import { prisma } from '../../app';
import { ApiError } from '../../middleware/error.middleware';
import {
  PromiseTask,
  PromiseAssignment,
  PromiseStatus,
  RepeatType,
} from '@prisma/client';
import { addDays, addMonths, addWeeks, format } from 'date-fns';
import * as plantService from '../plant/plant.service';
import * as ticketService from '../ticket/ticket.service';


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
 * 약속 생성
 */
export const createPromise = async (
  userId: string,
  title: string,
  description: string | null,
  repeatType: RepeatType,
  startDate: Date,
  endDate: Date | null,
  childIds: string[],
) => {
  // 부모 프로필 ID 조회
  const parentProfileId = await getParentProfileId(userId);

  // 자녀와의 관계 확인
  const connections = await prisma.childParentConnection.findMany({
    where: {
      parentId: parentProfileId,
      childId: {
        in: childIds,
      },
    },
  });

  if (connections.length !== childIds.length) {
    throw new ApiError('연결되지 않은 자녀가 포함되어 있습니다.', 400);
  }

  // 트랜잭션으로 약속 및 할당 생성
  return await prisma.$transaction(async (prisma) => {
    // 약속 생성
    const promise = await prisma.promiseTask.create({
      data: {
        title,
        description,
        repeatType,
        startDate,
        endDate,
        createdBy: parentProfileId,
      },
    });

    // 각 자녀에게 약속 할당
    for (const childId of childIds) {
      await createPromiseAssignments(
        prisma,
        promise,
        childId,
        startDate,
        endDate,
        repeatType,
      );
    }

    return promise;
  });
};

/**
 * 약속 할당 생성 (내부 함수)
 */
const createPromiseAssignments = async (
  prisma: any,
  promise: any, // 타입을 any로 설정
  childId: string,
  startDate: Date,
  endDate: Date | null,
  repeatType: RepeatType,
) => {
  const assignments: Partial<PromiseAssignment>[] = [];

  // 반복 약속이 아닌 경우 (한 번만)
  if (repeatType === RepeatType.ONCE) {
    assignments.push({
      promiseId: promise.id,
      childId,
      dueDate: startDate,
      status: PromiseStatus.PENDING,
    });
  } else {
    // 반복 약속의 경우 (매일, 매주, 매월)
    let currentDate = new Date(startDate);
    const lastDate = endDate || addMonths(startDate, 3); // 종료일이 없으면 3개월로 제한

    while (currentDate <= lastDate) {
      assignments.push({
        promiseId: promise.id,
        childId,
        dueDate: new Date(currentDate),
        status: PromiseStatus.PENDING,
      });

      // 반복 유형에 따라 다음 날짜 계산
      switch (repeatType) {
        case RepeatType.DAILY:
          currentDate = addDays(currentDate, 1);
          break;
        case RepeatType.WEEKLY:
          currentDate = addWeeks(currentDate, 1);
          break;
        case RepeatType.MONTHLY:
          currentDate = addMonths(currentDate, 1);
          break;
      }
    }
  }

  // 할당 데이터 저장
  for (const assignment of assignments) {
    await prisma.promiseAssignment.create({
      data: assignment as any,
    });
  }

  // 자녀에게 알림 생성
  await prisma.notification.create({
    data: {
      userId: await getUserIdFromChildProfileId(prisma, childId),
      title: '새로운 약속이 생성되었습니다',
      content: `'${promise.title}' 약속이 부모님에 의해 생성되었습니다.`,
      notificationType: 'PROMISE_CREATED',
      relatedId: promise.id,
    },
  });
};

/**
 * 자녀 프로필 ID로 사용자 ID 조회 (내부 함수)
 */
const getUserIdFromChildProfileId = async (
  prisma: any,
  childProfileId: string,
): Promise<string> => {
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childProfileId },
    select: { userId: true },
  });

  if (!childProfile) {
    throw new ApiError('자녀 프로필을 찾을 수 없습니다.', 404);
  }

  return childProfile.userId;
};

/**
 * 부모의 자녀 목록 조회
 */
export const getParentChildren = async (userId: string) => {
  const parentProfileId = await getParentProfileId(userId);

  return await prisma.childParentConnection.findMany({
    where: {
      parentId: parentProfileId,
    },
    include: {
      child: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });
};

/**
 * 부모의 약속 목록 조회
 */
export const getParentPromises = async (userId: string) => {
  const parentProfileId = await getParentProfileId(userId);

  return await prisma.promiseTask.findMany({
    where: {
      createdBy: parentProfileId,
    },
    include: {
      assignments: {
        include: {
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
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

/**
 * 자녀의 약속 목록 조회
 */
export const getChildPromises = async (
  userId: string,
  status?: PromiseStatus,
) => {
  const childProfileId = await getChildProfileId(userId);

  const where: any = {
    childId: childProfileId,
  };

  if (status) {
    where.status = status;
  }

  return await prisma.promiseAssignment.findMany({
    where,
    include: {
      promise: true,
    },
    orderBy: {
      dueDate: 'asc',
    },
  });
};

/**
 * 약속 상세 조회
 */
export const getPromiseById = async (promiseId: string, userId: string) => {
  // 부모 또는 자녀 프로필 ID 조회
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true },
  });

  if (!user) {
    throw new ApiError('사용자를 찾을 수 없습니다.', 404);
  }

  const promise = await prisma.promiseTask.findUnique({
    where: { id: promiseId },
    include: {
      parent: {
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      },
      assignments: {
        include: {
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
      },
    },
  });

  if (!promise) {
    throw new ApiError('약속을 찾을 수 없습니다.', 404);
  }

  // 권한 확인
  if (user.userType === 'PARENT') {
    const parentProfileId = await getParentProfileId(userId);
    if (promise.createdBy !== parentProfileId) {
      throw new ApiError('이 약속에 대한 접근 권한이 없습니다.', 403);
    }
  } else if (user.userType === 'CHILD') {
    const childProfileId = await getChildProfileId(userId);
    const hasAssignment = promise.assignments.some(
      (assignment) => assignment.childId === childProfileId,
    );

    if (!hasAssignment) {
      throw new ApiError('이 약속에 대한 접근 권한이 없습니다.', 403);
    }
  }

  return promise;
};

/**
 * 약속 수정
 */
export const updatePromise = async (
  promiseId: string,
  userId: string,
  updateData: {
    title?: string;
    description?: string | null;
    repeatType?: RepeatType;
    startDate?: Date;
    endDate?: Date | null;
    childIds?: string[];
  },
) => {
  const parentProfileId = await getParentProfileId(userId);

  // 약속 존재 및 소유 확인
  const promise = await prisma.promiseTask.findUnique({
    where: { id: promiseId },
    include: {
      assignments: true,
    },
  });

  if (!promise) {
    throw new ApiError('약속을 찾을 수 없습니다.', 404);
  }

  if (promise.createdBy !== parentProfileId) {
    throw new ApiError('이 약속을 수정할 권한이 없습니다.', 403);
  }

  return await prisma.$transaction(async (prisma) => {
    // 기본 약속 정보 업데이트
    const updatedPromise = await prisma.promiseTask.update({
      where: { id: promiseId },
      data: {
        title: updateData.title || undefined,
        description:
          'description' in updateData ? updateData.description : undefined,
        repeatType: updateData.repeatType || undefined,
        startDate: updateData.startDate || undefined,
        endDate: 'endDate' in updateData ? updateData.endDate : undefined,
      },
    });

    // 자녀 정보가 변경된 경우
    if (updateData.childIds) {
      // 현재 할당된 자녀 목록
      const currentChildIds = promise.assignments.map((a) => a.childId);

      // 새로 추가할 자녀
      const childIdsToAdd = updateData.childIds.filter(
        (id) => !currentChildIds.includes(id),
      );

      // 제거할 자녀
      const childIdsToRemove = currentChildIds.filter(
        (id) => !updateData.childIds!.includes(id),
      );

      // 제거할 자녀의 할당 삭제
      if (childIdsToRemove.length > 0) {
        await prisma.promiseAssignment.deleteMany({
          where: {
            promiseId,
            childId: {
              in: childIdsToRemove,
            },
          },
        });
      }

      // 새로 추가할 자녀에게 약속 할당
      for (const childId of childIdsToAdd) {
        const updateStartDate = updateData.startDate || promise.startDate;
        const updateEndDate =
          updateData.endDate !== undefined
            ? updateData.endDate
            : promise.endDate;
        const updateRepeatType = updateData.repeatType || promise.repeatType;

        await createPromiseAssignments(
          prisma,
          promise,
          childId,
          updateStartDate,
          updateEndDate,
          updateRepeatType,
        );
      }
    }

    return updatedPromise;
  });
};

/**
 * 약속 삭제
 */
export const deletePromise = async (promiseId: string, userId: string) => {
  const parentProfileId = await getParentProfileId(userId);

  // 약속 존재 및 소유 확인
  const promise = await prisma.promiseTask.findUnique({
    where: { id: promiseId },
  });

  if (!promise) {
    throw new ApiError('약속을 찾을 수 없습니다.', 404);
  }

  if (promise.createdBy !== parentProfileId) {
    throw new ApiError('이 약속을 삭제할 권한이 없습니다.', 403);
  }

  // 관련 할당 및 약속 삭제
  return await prisma.$transaction(async (prisma) => {
    // 관련 알림 삭제
    await prisma.notification.deleteMany({
      where: {
        relatedId: promiseId,
      },
    });

    // 약속 할당 삭제
    await prisma.promiseAssignment.deleteMany({
      where: {
        promiseId,
      },
    });

    // 약속 삭제
    return await prisma.promiseTask.delete({
      where: {
        id: promiseId,
      },
    });
  });
};

/**
 * 약속 인증 제출
 */
export const submitVerification = async (
  promiseAssignmentId: string,
  userId: string,
  imagePath: string,
  verificationDescription: string | null // 추가: 인증 설명 파라미터
) => {
  // 기존 코드...

  // 약속 할당 업데이트
  const updatedAssignment = await prisma.$transaction(async (prisma) => {
    // 상태 업데이트
    const updated = await prisma.promiseAssignment.update({
      where: { id: promiseAssignmentId },
      data: {
        status: PromiseStatus.SUBMITTED,
        verificationImage: imagePath,
        verificationTime: new Date(),
        verificationDescription: verificationDescription, // 추가: 인증 설명 저장
      },
    });

    // 나머지 코드...
  });

  return updatedAssignment;
};
/**
 * 약속 인증 응답 (승인/거절) - 티켓 시스템 연동 버전
 */
export const respondToVerification = async (
  promiseAssignmentId: string,
  userId: string,
  approved: boolean,
  rejectionReason?: string,
) => {
  const parentProfileId = await getParentProfileId(userId);

  // 응답 객체 초기화
  let experienceGained = 0;
  let updatedAssignment;

  // 약속 할당 확인
  const promiseAssignment = await prisma.promiseAssignment.findUnique({
    where: { id: promiseAssignmentId },
    include: {
      promise: true,
      child: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          parents: true,
        },
      },
    },
  });

  if (!promiseAssignment) {
    throw new ApiError('약속 할당을 찾을 수 없습니다.', 404);
  }

  // 부모-자녀 관계 확인
  const hasRelationship = await prisma.childParentConnection.findFirst({
    where: {
      childId: promiseAssignment.childId,
      parentId: parentProfileId,
    },
  });

  if (!hasRelationship) {
    throw new ApiError('이 약속을 승인/거절할 권한이 없습니다.', 403);
  }

  if (promiseAssignment.status !== PromiseStatus.SUBMITTED) {
    throw new ApiError('인증 요청 상태가 아닌 약속입니다.', 400);
  }

  return await prisma.$transaction(async (prisma) => {
    // 약속 상태 업데이트
    const updatedAssignment = await prisma.promiseAssignment.update({
      where: { id: promiseAssignmentId },
      data: {
        status: approved ? PromiseStatus.APPROVED : PromiseStatus.REJECTED,
        rejectionReason: approved ? null : rejectionReason,
        completedAt: approved ? new Date() : null,
      },
    });

    // 자녀에게 알림 생성
    await prisma.notification.create({
      data: {
        userId: promiseAssignment.child.user.id,
        title: approved ? '약속 인증 성공' : '약속 인증 실패',
        content: approved
          ? `${promiseAssignment.promise.title} 약속 인증이 승인되었습니다. 축하합니다!`
          : `${promiseAssignment.promise.title} 약속 인증이 거절되었습니다. 사유: ${rejectionReason}`,
        notificationType: approved ? 'PROMISE_APPROVED' : 'PROMISE_REJECTED',
        relatedId: promiseAssignmentId,
      },
    });

    // 승인된 경우 스티커 부여 및 식물 경험치 추가
    if (approved) {
      // 🎯 티켓 시스템 연동: 약속 인증 완료 카운트 증가 및 보상 체크
      try {
        await ticketService.handleVerificationComplete(promiseAssignment.childId);
      } catch (error) {
        console.error('티켓 시스템 처리 오류:', error);
        // 티켓 시스템 오류가 발생해도 전체 트랜잭션을 실패하지 않도록 무시
      }

      // 현재 키우고 있는 식물 조회
      const childProfile = await prisma.childProfile.findUnique({
        where: { id: promiseAssignment.childId },
        include: {
          plants: {
            where: {
              isCompleted: false,
            },
            orderBy: {
              startedAt: 'desc',
            },
            take: 1,
          },
        },
      });

      // 현재 키우고 있는 식물이 있으면 경험치 추가
      if (childProfile && childProfile.plants.length > 0) {
        const currentPlant = childProfile.plants[0];

        // 약속 유형에 따른 경험치 차등 지급
        experienceGained = 10; // 기본 값

        switch (promiseAssignment.promise.repeatType) {
          case RepeatType.DAILY:
            experienceGained = 5; // 매일 반복되는 약속은 적은 경험치
            break;
          case RepeatType.WEEKLY:
            experienceGained = 10; // 주간 약속은 기본 경험치
            break;
          case RepeatType.MONTHLY:
            experienceGained = 15; // 월간 약속은 높은 경험치
            break;
          case RepeatType.ONCE:
            experienceGained = 20; // 일회성 약속은 가장 높은 경험치
            break;
        }

        try {
          // 식물 업데이트
          const updatedPlant = await prisma.plant.update({
            where: { id: currentPlant.id },
            data: {
              experience: currentPlant.experience + experienceGained,
              canGrow:
                currentPlant.experience + experienceGained >=
                currentPlant.experienceToGrow,
            },
          });

          // 식물이 성장 가능한 상태가 되었다면 알림 생성
          if (updatedPlant.canGrow) {
            await prisma.notification.create({
              data: {
                userId: promiseAssignment.child.user.id,
                title: '식물이 성장할 준비가 되었어요!',
                content: `${
                  updatedPlant.name || '식물'
                }에게 충분한 경험치가 모였어요. 성장시켜 보세요!`,
                notificationType: 'SYSTEM',
                relatedId: updatedPlant.id,
              },
            });
          }
        } catch (error) {
          console.error('식물 업데이트 오류:', error);
          // 오류가 발생해도 전체 트랜잭션을 실패하지 않도록 무시
        }
      }

      // 캐릭터 성장 단계 업데이트 로직
      await updateCharacterStage(prisma, promiseAssignment.childId);
    }

    // 응답 객체 반환 (경험치 정보 포함)
    return {
      promiseAssignment: updatedAssignment,
      experienceGained: approved ? experienceGained : 0,
    };
  });
};
/**
 * 캐릭터 성장 단계 업데이트 (내부 함수)
 */
const updateCharacterStage = async (prisma: any, childId: string) => {
  // 완료된 약속 수 계산
  const completedPromisesCount = await prisma.promiseAssignment.count({
    where: {
      childId,
      status: PromiseStatus.APPROVED,
    },
  });

  // 받은 스티커 수 계산
  const stickersCount = await prisma.sticker.count({
    where: {
      childId,
    },
  });

  // 성장 단계 결정 (성장 단계는 1~5까지)
  let newStage = 1;

  if (completedPromisesCount >= 20 && stickersCount >= 20) {
    newStage = 5;
  } else if (completedPromisesCount >= 15 && stickersCount >= 15) {
    newStage = 4;
  } else if (completedPromisesCount >= 10 && stickersCount >= 10) {
    newStage = 3;
  } else if (completedPromisesCount >= 5 && stickersCount >= 5) {
    newStage = 2;
  }

  // 현재 단계 조회
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { characterStage: true },
  });

  // 성장 단계가 높아진 경우만 업데이트
  if (childProfile && newStage > childProfile.characterStage) {
    await prisma.childProfile.update({
      where: { id: childId },
      data: { characterStage: newStage },
    });

    // 자녀에게 캐릭터 성장 알림
    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: { userId: true },
    });

    if (child) {
      await prisma.notification.create({
        data: {
          userId: child.userId,
          title: '식물이 자랐어요!',
          content: `축하합니다! 약속을 성실히 지켜서 식물이 ${newStage}단계로 성장했어요!`,
          notificationType: 'SYSTEM',
          relatedId: null,
        },
      });
    }
  }
};

/**
 * 승인 대기 중인 약속 인증 목록 조회 (부모용)
 */
export const getPendingVerifications = async (userId: string) => {
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

  const childIds = children.map((child) => child.childId);

  // 자녀들의 승인 대기 중인 약속 인증 조회
  return await prisma.promiseAssignment.findMany({
    where: {
      childId: {
        in: childIds,
      },
      status: PromiseStatus.SUBMITTED,
    },
    include: {
      promise: true,
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
    },
    orderBy: {
      verificationTime: 'desc',
    },
  });
};

/**
 * 약속 통계 조회 (자녀용)
 */
export const getChildPromiseStats = async (userId: string) => {
  const childProfileId = await getChildProfileId(userId);

  // 전체 약속 수
  const totalPromises = await prisma.promiseAssignment.count({
    where: {
      childId: childProfileId,
    },
  });

  // 완료된 약속 수
  const completedPromises = await prisma.promiseAssignment.count({
    where: {
      childId: childProfileId,
      status: PromiseStatus.APPROVED,
    },
  });

  // 진행 중인 약속 수
  const pendingPromises = await prisma.promiseAssignment.count({
    where: {
      childId: childProfileId,
      status: {
        in: [PromiseStatus.PENDING, PromiseStatus.SUBMITTED],
      },
    },
  });

  // 캐릭터 단계
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childProfileId },
    select: { characterStage: true },
  });

  // 스티커 수
  const stickerCount = await prisma.sticker.count({
    where: {
      childId: childProfileId,
    },
  });

  return {
    totalPromises,
    completedPromises,
    pendingPromises,
    characterStage: childProfile?.characterStage || 1,
    stickerCount,
  };
};

/**
 * 부모가 특정 자녀의 약속 과제 목록 조회
 */
export const getPromiseAssignmentsByChild = async (
  childId: string,
  parentId: string,
) => {
  // 부모-자녀 관계 확인
  const parentProfile = await prisma.parentProfile.findFirst({
    where: {
      user: {
        id: parentId,
      },
    },
  });

  if (!parentProfile) {
    throw new ApiError('부모 프로필을 찾을 수 없습니다.', 404);
  }

  // 연결 확인
  const connection = await prisma.childParentConnection.findFirst({
    where: {
      parentId: parentProfile.id,
      childId,
    },
  });

  if (!connection) {
    throw new ApiError('이 자녀에 대한 접근 권한이 없습니다.', 403);
  }

  // 약속 과제 목록 조회
  return await prisma.promiseAssignment.findMany({
    where: {
      childId,
    },
    include: {
      promise: true,
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
    },
  });
};
