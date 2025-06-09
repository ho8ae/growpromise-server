// src/api/promise/promise.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as promiseService from './promise.service';
import { RepeatType } from '@prisma/client';
import * as notificationService from '../notification/notification.service';

/**
 * 약속 생성
 * @route POST /api/promises
 */
export const createPromise = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { title, description, repeatType, startDate, endDate, childIds } =
      req.body;

    const startDateObj = new Date(startDate);
    const endDateObj = endDate ? new Date(endDate) : null;

    const result = await promiseService.createPromise(
      req.user.id,
      title,
      description || null,
      (repeatType as RepeatType) || RepeatType.ONCE,
      startDateObj,
      endDateObj,
      childIds,
    );
    // 🔥 자녀들에게 알림 전송

    try {
      // 생성된 약속의 할당 정보를 다시 조회
      const promiseWithAssignments =
        await promiseService.getPromiseWithAssignments(result.id);

      if (
        promiseWithAssignments?.assignments &&
        promiseWithAssignments.assignments.length > 0
      ) {
        for (const assignment of promiseWithAssignments.assignments) {
          try {
            await notificationService.createPromiseNotification(
              assignment.child.user.id,
              title,
              'created',
              result.id,
            );
          } catch (error) {
            console.error('약속 생성 알림 전송 실패:', error);
          }
        }
      }
    } catch (error) {
      console.error('약속 할당 정보 조회 실패:', error);
    }

    res.status(201).json({
      success: true,
      message: '약속이 성공적으로 생성되었습니다.',
      data: result,
    });
  },
);

/**
 * 부모의 자녀 목록 조회
 * @route GET /api/promises/children
 */
export const getParentChildren = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const children = await promiseService.getParentChildren(req.user.id);

    res.status(200).json({
      success: true,
      data: children,
    });
  },
);

/**
 * 부모의 약속 목록 조회
 * @route GET /api/promises
 */
export const getParentPromises = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const promises = await promiseService.getParentPromises(req.user.id);

    res.status(200).json({
      success: true,
      data: promises,
    });
  },
);

/**
 * 자녀의 약속 목록 조회
 * @route GET /api/promises/child
 */
export const getChildPromises = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { status } = req.query;

    const promises = await promiseService.getChildPromises(
      req.user.id,
      status as any,
    );

    res.status(200).json({
      success: true,
      data: promises,
    });
  },
);

/**
 * 약속 상세 조회
 * @route GET /api/promises/:id
 */
export const getPromiseById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { id } = req.params;

    const promise = await promiseService.getPromiseById(id, req.user.id);

    res.status(200).json({
      success: true,
      data: promise,
    });
  },
);

/**
 * 약속 수정
 * @route PUT /api/promises/:id
 */
export const updatePromise = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { id } = req.params;
    const { title, description, repeatType, startDate, endDate, childIds } =
      req.body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (repeatType !== undefined) updateData.repeatType = repeatType;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null;
    if (childIds !== undefined) updateData.childIds = childIds;

    const promise = await promiseService.updatePromise(
      id,
      req.user.id,
      updateData,
    );

    res.status(200).json({
      success: true,
      message: '약속이 성공적으로 수정되었습니다.',
      data: promise,
    });
  },
);

/**
 * 약속 삭제
 * @route DELETE /api/promises/:id
 */
export const deletePromise = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { id } = req.params;

    await promiseService.deletePromise(id, req.user.id);

    res.status(200).json({
      success: true,
      message: '약속이 성공적으로 삭제되었습니다.',
    });
  },
);

/**
 * 약속 인증 제출
 * @route POST /api/promises/verify
 */
export const submitVerification = asyncHandler(async (req: any, res: any) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  const { promiseAssignmentId, verificationDescription } = req.body;

  // S3에 업로드된 이미지 URL 사용
  const imageUrl = req.fileUrl;

  if (!imageUrl) {
    return res.status(400).json({
      success: false,
      message: '인증 이미지가 필요합니다.',
    });
  }

  // 서비스 호출 시 이미지 URL과 설명(선택 사항) 전달
  const result = await promiseService.submitVerification(
    promiseAssignmentId,
    req.user.id,
    imageUrl,
    verificationDescription || null, // 설명이 없으면 null 처리
  );

  try {
    // 약속 할당 정보로부터 약속 정보 가져오기
    const assignmentInfo = await promiseService.getPromiseAssignmentUserIds(
      promiseAssignmentId,
    );

    if (assignmentInfo.parentUserId && assignmentInfo.promiseTitle) {
      await notificationService.createPromiseNotification(
        assignmentInfo.parentUserId,
        assignmentInfo.promiseTitle,
        'verified',
        result.promiseId
      );
    }
  } catch (error) {
    console.error('약속 인증 알림 전송 실패:', error);
  }

  res.status(200).json({
    success: true,
    message: '약속 인증이 성공적으로 제출되었습니다.',
    data: result,
  });
});

/**
 * 약속 인증 응답 (승인/거절)
 * @route POST /api/promises/verify/respond/:id
 */
export const respondToVerification = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { id } = req.params;
    const { approved, rejectionReason } = req.body;

    const result = await promiseService.respondToVerification(
      id,
      req.user.id,
      approved,
      rejectionReason,
    );

    try {
      const assignmentInfo = await promiseService.getPromiseAssignmentUserIds(id);
      
      if (assignmentInfo.childUserId && assignmentInfo.promiseTitle) {
        await notificationService.createPromiseNotification(
          assignmentInfo.childUserId,
          assignmentInfo.promiseTitle,
          approved ? 'approved' : 'rejected',
          result.promiseAssignment.promiseId
        );
      }
    } catch (error) {
      console.error('약속 응답 알림 전송 실패:', error);
    }

    // 응답 메시지에 경험치 획득 정보 포함
    const message = approved
      ? result.experienceGained > 0
        ? `약속 인증이 승인되었습니다. 아이의 식물에 ${result.experienceGained} 경험치가 추가되었습니다!`
        : '약속 인증이 승인되었습니다.'
      : '약속 인증이 거절되었습니다.';

    res.status(200).json({
      success: true,
      message,
      data: result,
    });
  },
);

/**
 * 승인 대기 중인 약속 인증 목록 조회
 * @route GET /api/promises/verifications/pending
 */
export const getPendingVerifications = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const result = await promiseService.getPendingVerifications(req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

/**
 * 약속 통계 조회 (자녀용)
 * @route GET /api/promises/stats
 */
export const getChildPromiseStats = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const result = await promiseService.getChildPromiseStats(req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

/**
 * 부모가 특정 자녀의 약속 과제 목록 조회
 * @route GET /api/promises/assignments/:childId
 */
export const getPromiseAssignmentsByChild = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    const { childId } = req.params;

    const assignments = await promiseService.getPromiseAssignmentsByChild(
      childId,
      req.user.id,
    );

    res.status(200).json({
      success: true,
      data: assignments,
    });
  },
);
