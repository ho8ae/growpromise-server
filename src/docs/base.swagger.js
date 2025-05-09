/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - userType
 *       properties:
 *         id:
 *           type: string
 *           description: 사용자 고유 ID
 *         username:
 *           type: string
 *           description: 사용자 이름
 *         email:
 *           type: string
 *           format: email
 *           description: 이메일 주소 (부모 계정에 필수)
 *         password:
 *           type: string
 *           format: password
 *           description: 비밀번호
 *         userType:
 *           type: string
 *           enum: [PARENT, CHILD]
 *           description: 사용자 유형
 *         profileImage:
 *           type: string
 *           description: 프로필 이미지 URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 계정 생성 시간
 *
 *     Promise:
 *       type: object
 *       required:
 *         - title
 *         - startDate
 *       properties:
 *         id:
 *           type: string
 *           description: 약속 고유 ID
 *         title:
 *           type: string
 *           description: 약속 제목
 *         description:
 *           type: string
 *           description: 약속 설명
 *         repeatType:
 *           type: string
 *           enum: [ONCE, DAILY, WEEKLY, MONTHLY]
 *           description: 약속 반복 유형
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: 약속 시작일
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: 약속 종료일 (반복 약속인 경우)
 *         createdBy:
 *           type: string
 *           description: 약속을 생성한 부모 ID
 *
 *     PromiseAssignment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 약속 할당 고유 ID
 *         promiseId:
 *           type: string
 *           description: 약속 ID
 *         childId:
 *           type: string
 *           description: 자녀 ID
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: 약속 기한
 *         status:
 *           type: string
 *           enum: [PENDING, SUBMITTED, APPROVED, REJECTED, EXPIRED]
 *           description: 약속 상태
 *         verificationImage:
 *           type: string
 *           description: 인증 이미지 URL
 *         verificationTime:
 *           type: string
 *           format: date-time
 *           description: 인증 제출 시간
 *         rejectionReason:
 *           type: string
 *           description: 거절 사유 (거절된 경우)
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: 완료 시간 (승인된 경우)
 *
 *     Sticker:
 *       type: object
 *       required:
 *         - childId
 *         - title
 *       properties:
 *         id:
 *           type: string
 *           description: 스티커 고유 ID
 *         childId:
 *           type: string
 *           description: 자녀 ID
 *         title:
 *           type: string
 *           description: 스티커 제목
 *         description:
 *           type: string
 *           description: 스티커 설명
 *         imageUrl:
 *           type: string
 *           description: 스티커 이미지 URL
 *         rewardId:
 *           type: string
 *           description: 보상 ID (사용된 경우)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 스티커 생성 시간
 *
 *     Reward:
 *       type: object
 *       required:
 *         - parentId
 *         - title
 *         - requiredStickers
 *       properties:
 *         id:
 *           type: string
 *           description: 보상 고유 ID
 *         parentId:
 *           type: string
 *           description: 부모 ID
 *         title:
 *           type: string
 *           description: 보상 제목
 *         description:
 *           type: string
 *           description: 보상 설명
 *         requiredStickers:
 *           type: integer
 *           description: 필요한 스티커 수
 *         isActive:
 *           type: boolean
 *           description: 활성화 여부
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 보상 생성 시간
 *
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 알림 고유 ID
 *         userId:
 *           type: string
 *           description: 사용자 ID
 *         title:
 *           type: string
 *           description: 알림 제목
 *         content:
 *           type: string
 *           description: 알림 내용
 *         notificationType:
 *           type: string
 *           enum: [SYSTEM, PROMISE_CREATED, PROMISE_VERIFIED, PROMISE_APPROVED, PROMISE_REJECTED, REWARD_EARNED]
 *           description: 알림 유형
 *         relatedId:
 *           type: string
 *           description: 관련 엔티티 ID
 *         isRead:
 *           type: boolean
 *           description: 읽음 여부
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 알림 생성 시간
 *
 *   responses:
 *     Unauthorized:
 *       description: 인증되지 않은 요청
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: 인증이 필요합니다.
 *     
 *     Forbidden:
 *       description: 접근 권한 없음
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: 이 리소스에 대한 접근 권한이 없습니다.
 *     
 *     NotFound:
 *       description: 리소스를 찾을 수 없음
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: 요청한 리소스를 찾을 수 없습니다.
 *
 *     ValidationError:
 *       description: 유효성 검사 오류
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: 유효성 검사 오류가 발생했습니다.
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     param:
 *                       type: string
 *                       example: username
 *                     message:
 *                       type: string
 *                       example: 사용자 이름은 필수입니다.
 */