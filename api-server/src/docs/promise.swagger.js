/**
 * @swagger
 * tags:
 *   name: Promises
 *   description: 약속 관리 및 인증 시스템
 * 
 * /api/promises:
 *   post:
 *     summary: 약속 생성 (부모 전용)
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - childIds
 *             properties:
 *               title:
 *                 type: string
 *                 example: "숙제 완료하기"
 *               description:
 *                 type: string
 *                 example: "학교에서 나온 모든 숙제를 완료하고 인증해주세요."
 *               repeatType:
 *                 type: string
 *                 enum: [ONCE, DAILY, WEEKLY, MONTHLY]
 *                 default: ONCE
 *                 example: "DAILY"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-05-10T15:00:00.000Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-10T15:00:00.000Z"
 *               childIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["child-id-1", "child-id-2"]
 *     responses:
 *       201:
 *         description: 약속 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "약속이 성공적으로 생성되었습니다."
 *                 data:
 *                   $ref: '#/components/schemas/Promise'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   
 *   get:
 *     summary: 부모의 약속 목록 조회 (부모 전용)
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 약속 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       repeatType:
 *                         type: string
 *                         enum: [ONCE, DAILY, WEEKLY, MONTHLY]
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                       createdBy:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       assignments:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             childId:
 *                               type: string
 *                             dueDate:
 *                               type: string
 *                               format: date-time
 *                             status:
 *                               type: string
 *                               enum: [PENDING, SUBMITTED, APPROVED, REJECTED, EXPIRED]
 *                             child:
 *                               type: object
 *                               properties:
 *                                 user:
 *                                   type: object
 *                                   properties:
 *                                     username:
 *                                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/promises/child:
 *   get:
 *     summary: 자녀의 약속 목록 조회 (자녀 전용)
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUBMITTED, APPROVED, REJECTED, EXPIRED]
 *         description: 약속 상태별 필터링
 *     responses:
 *       200:
 *         description: 약속 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       promiseId:
 *                         type: string
 *                       childId:
 *                         type: string
 *                       dueDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                         enum: [PENDING, SUBMITTED, APPROVED, REJECTED, EXPIRED]
 *                       verificationImage:
 *                         type: string
 *                       verificationTime:
 *                         type: string
 *                         format: date-time
 *                       rejectionReason:
 *                         type: string
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                       promise:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           repeatType:
 *                             type: string
 *                             enum: [ONCE, DAILY, WEEKLY, MONTHLY]
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 * 
 * /api/promises/children:
 *   get:
 *     summary: 부모의 자녀 목록 조회 (부모용)
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 자녀 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       childId:
 *                         type: string
 *                       parentId:
 *                         type: string
 *                       child:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/promises/{id}:
 *   get:
 *     summary: 약속 상세 조회
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 약속 ID
 *     responses:
 *       200:
 *         description: 약속 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     repeatType:
 *                       type: string
 *                       enum: [ONCE, DAILY, WEEKLY, MONTHLY]
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     createdBy:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     parent:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                           properties:
 *                             username:
 *                               type: string
 *                     assignments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           childId:
 *                             type: string
 *                           dueDate:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                             enum: [PENDING, SUBMITTED, APPROVED, REJECTED, EXPIRED]
 *                           child:
 *                             type: object
 *                             properties:
 *                               user:
 *                                 type: object
 *                                 properties:
 *                                   username:
 *                                     type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   
 *   put:
 *     summary: 약속 수정 (부모 전용)
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 약속 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               repeatType:
 *                 type: string
 *                 enum: [ONCE, DAILY, WEEKLY, MONTHLY]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               childIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 약속 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "약속이 성공적으로 수정되었습니다."
 *                 data:
 *                   $ref: '#/components/schemas/Promise'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   
 *   delete:
 *     summary: 약속 삭제 (부모 전용)
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 약속 ID
 *     responses:
 *       200:
 *         description: 약속 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "약속이 성공적으로 삭제되었습니다."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/promises/verify:
 *   post:
 *     summary: 약속 인증 제출 (자녀 전용)
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - promiseAssignmentId
 *               - image
 *             properties:
 *               promiseAssignmentId:
 *                 type: string
 *                 example: "assignment-id-1"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 인증 이미지 파일
 *     responses:
 *       200:
 *         description: 약속 인증 제출 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "약속 인증이 성공적으로 제출되었습니다."
 *                 data:
 *                   $ref: '#/components/schemas/PromiseAssignment'
 *       400:
 *         description: 인증 이미지 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "인증 이미지가 필요합니다."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/promises/verify/respond/{id}:
 *   post:
 *     summary: 약속 인증 응답 (부모 전용)
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 약속 할당 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *                 example: true
 *               rejectionReason:
 *                 type: string
 *                 example: "사진이 너무 흐려요. 다시 찍어주세요."
 *     responses:
 *       200:
 *         description: 약속 인증 응답 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "약속 인증이 승인되었습니다."
 *                 data:
 *                   $ref: '#/components/schemas/PromiseAssignment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/promises/verifications/pending:
 *   get:
 *     summary: 승인 대기 중인 약속 인증 목록 조회 (부모 전용)
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 대기 중인 인증 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       promiseId:
 *                         type: string
 *                       childId:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [SUBMITTED]
 *                       verificationImage:
 *                         type: string
 *                       verificationTime:
 *                         type: string
 *                         format: date-time
 *                       promise:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                       child:
 *                         type: object
 *                         properties:
 *                           user:
 *                             type: object
 *                             properties:
 *                               username:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/promises/stats:
 *   get:
 *     summary: 약속 통계 조회 (자녀용)
 *     tags: [Promises]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 약속 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPromises:
 *                       type: integer
 *                       example: 10
 *                     completedPromises:
 *                       type: integer
 *                       example: 5
 *                     pendingPromises:
 *                       type: integer
 *                       example: 3
 *                     characterStage:
 *                       type: integer
 *                       example: 2
 *                     stickerCount:
 *                       type: integer
 *                       example: 7
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */