/**
 * @swagger
 * tags:
 *   name: Rewards
 *   description: 보상 시스템 관리
 * 
 * /api/rewards:
 *   post:
 *     summary: 보상 생성 (부모 전용)
 *     tags: [Rewards]
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
 *               - requiredStickers
 *             properties:
 *               title:
 *                 type: string
 *                 example: "아이스크림 사주기"
 *               description:
 *                 type: string
 *                 example: "칭찬 스티커 10개를 모으면 아이스크림을 사드립니다."
 *               requiredStickers:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *     responses:
 *       201:
 *         description: 보상 생성 성공
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
 *                   example: "보상이 성공적으로 생성되었습니다."
 *                 data:
 *                   $ref: '#/components/schemas/Reward'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/rewards/parent:
 *   get:
 *     summary: 부모의 보상 목록 조회 (부모 전용)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 보상 목록 조회 성공
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
 *                       parentId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       requiredStickers:
 *                         type: integer
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/rewards/child:
 *   get:
 *     summary: 자녀의 보상 목록 조회 (자녀 전용)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 보상 목록 조회 성공
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
 *                       parentId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       requiredStickers:
 *                         type: integer
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       availableStickers:
 *                         type: integer
 *                         description: 사용 가능한 스티커 수
 *                       progress:
 *                         type: number
 *                         format: float
 *                         description: 달성 진행도 (%)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 * 
 * /api/rewards/{id}:
 *   get:
 *     summary: 보상 상세 조회
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 보상 ID
 *     responses:
 *       200:
 *         description: 보상 상세 조회 성공
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
 *                     parentId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     requiredStickers:
 *                       type: integer
 *                     isActive:
 *                       type: boolean
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
 *                     stickers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           childId:
 *                             type: string
 *                           title:
 *                             type: string
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
 *     summary: 보상 업데이트 (부모 전용)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 보상 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "아이스크림 2개 사주기"
 *               description:
 *                 type: string
 *                 example: "칭찬 스티커 15개를 모으면 아이스크림 2개를 사드립니다."
 *               requiredStickers:
 *                 type: integer
 *                 minimum: 1
 *                 example: 15
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: 보상 업데이트 성공
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
 *                   example: "보상이 성공적으로 수정되었습니다."
 *                 data:
 *                   $ref: '#/components/schemas/Reward'
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
 *     summary: 보상 삭제 (부모 전용)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 보상 ID
 *     responses:
 *       200:
 *         description: 보상 삭제 성공
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
 *                   example: "보상이 성공적으로 삭제되었습니다."
 *       400:
 *         description: 연결된 스티커가 있어 삭제 불가
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
 *                   example: "이 보상에 연결된 스티커가 있습니다. 삭제할 수 없습니다."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/rewards/{id}/achieve:
 *   post:
 *     summary: 보상 달성 (자녀 전용)
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 보상 ID
 *     responses:
 *       200:
 *         description: 보상 달성 성공
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
 *                   example: "보상이 성공적으로 달성되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     reward:
 *                       $ref: '#/components/schemas/Reward'
 *                     usedStickers:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: 스티커 부족
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
 *                   example: "스티커가 부족합니다. 필요: 10개, 보유: 7개"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */