/**
 * @swagger
 * tags:
 *   name: Stickers
 *   description: 칭찬 스티커 관리
 * 
 * /api/stickers:
 *   post:
 *     summary: 스티커 생성 (부모 전용)
 *     tags: [Stickers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - childId
 *               - title
 *             properties:
 *               childId:
 *                 type: string
 *                 example: "child-id-1"
 *               title:
 *                 type: string
 *                 example: "숙제 완료"
 *               description:
 *                 type: string
 *                 example: "수학 숙제를 완벽하게 해결했어요!"
 *               rewardId:
 *                 type: string
 *                 description: 보상 ID (선택적)
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 스티커 이미지 파일 (선택적)
 *     responses:
 *       201:
 *         description: 스티커 생성 성공
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
 *                   example: "스티커가 성공적으로 생성되었습니다."
 *                 data:
 *                   $ref: '#/components/schemas/Sticker'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/stickers/child:
 *   get:
 *     summary: 자녀의 스티커 목록 조회 (자녀 전용)
 *     tags: [Stickers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 스티커 목록 조회 성공
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
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       rewardId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       reward:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           requiredStickers:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 * 
 * /api/stickers/child/{childId}:
 *   get:
 *     summary: 특정 자녀의 스티커 목록 조회 (부모 전용)
 *     tags: [Stickers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: 자녀 프로필 ID
 *     responses:
 *       200:
 *         description: 스티커 목록 조회 성공
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
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       rewardId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       reward:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           requiredStickers:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/stickers/{id}:
 *   get:
 *     summary: 스티커 상세 조회
 *     tags: [Stickers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 스티커 ID
 *     responses:
 *       200:
 *         description: 스티커 상세 조회 성공
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
 *                     childId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                     rewardId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     child:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                           properties:
 *                             username:
 *                               type: string
 *                     reward:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         requiredStickers:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   
 *   delete:
 *     summary: 스티커 삭제 (부모 전용)
 *     tags: [Stickers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 스티커 ID
 *     responses:
 *       200:
 *         description: 스티커 삭제 성공
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
 *                   example: "스티커가 성공적으로 삭제되었습니다."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/stickers/stats:
 *   get:
 *     summary: 스티커 통계 (자녀용)
 *     tags: [Stickers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 스티커 통계 조회 성공
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
 *                     totalStickers:
 *                       type: integer
 *                       example: 15
 *                     rewardStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rewardId:
 *                             type: string
 *                           rewardTitle:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           requiredStickers:
 *                             type: integer
 *                           progress:
 *                             type: number
 *                             format: float
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */