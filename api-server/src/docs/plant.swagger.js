/**
 * @swagger
 * tags:
 *   name: Plants
 *   description: 식물 성장 및 관리 시스템
 * 
 * /api/plants/types:
 *   get:
 *     summary: 모든 식물 유형 조회
 *     tags: [Plants]
 *     parameters:
 *       - in: query
 *         name: childId
 *         schema:
 *           type: string
 *         description: 자녀 ID (자녀에게 잠금 해제된 식물만 보기 위함)
 *     responses:
 *       200:
 *         description: 식물 유형 목록 조회 성공
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
 *                     $ref: '#/components/schemas/PlantType'
 *   
 *   post:
 *     summary: 식물 유형 추가 (관리자용)
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - growthStages
 *               - difficulty
 *               - category
 *               - imagePrefix
 *             properties:
 *               name:
 *                 type: string
 *                 example: "해바라기"
 *               description:
 *                 type: string
 *                 example: "해를 향해 자라는 아름다운 꽃입니다."
 *               growthStages:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 5
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *                 example: "MEDIUM"
 *               category:
 *                 type: string
 *                 enum: [FLOWER, TREE, VEGETABLE, FRUIT, OTHER]
 *                 example: "FLOWER"
 *               unlockRequirement:
 *                 type: integer
 *                 minimum: 0
 *                 example: 3
 *               imagePrefix:
 *                 type: string
 *                 example: "sunflower"
 *     responses:
 *       201:
 *         description: 식물 유형 생성 성공
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
 *                   example: "새 식물 유형이 생성되었습니다."
 *                 data:
 *                   $ref: '#/components/schemas/PlantType'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/plants/types/{id}:
 *   get:
 *     summary: 식물 유형 상세 조회
 *     tags: [Plants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 식물 유형 ID
 *     responses:
 *       200:
 *         description: 식물 유형 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PlantType'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/plants/current:
 *   get:
 *     summary: 현재 자녀의 식물 조회 (자녀 전용)
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 현재 식물 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Plant'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: 현재 키우고 있는 식물이 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: null
 * 
 * /api/plants/start:
 *   post:
 *     summary: 새 식물 시작하기 (자녀 전용)
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plantTypeId
 *             properties:
 *               plantTypeId:
 *                 type: string
 *                 example: "식물유형ID"
 *               plantName:
 *                 type: string
 *                 example: "내 해바라기"
 *     responses:
 *       201:
 *         description: 새 식물 시작 성공
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
 *                   example: "새 식물을 시작했습니다."
 *                 data:
 *                   $ref: '#/components/schemas/Plant'
 *       400:
 *         description: 이미 진행 중인 식물이 있음
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
 *                   example: "이미 진행 중인 식물이 있습니다. 새 식물을 시작하려면 현재 식물을 완료하세요."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/plants/{id}/water:
 *   post:
 *     summary: 식물에 물주기
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 식물 ID
 *     responses:
 *       200:
 *         description: 물주기 성공
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
 *                   example: "식물에 물을 주었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     wateringLog:
 *                       $ref: '#/components/schemas/WateringLog'
 *                     updatedPlant:
 *                       $ref: '#/components/schemas/Plant'
 *                     wateringStreak:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: 오늘 이미 물을 줌 또는 이미 완료된 식물
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
 *                   example: "오늘 이미 물을 주었습니다. 내일 다시 시도하세요."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/plants/{id}/grow:
 *   post:
 *     summary: 식물 성장 단계 올리기
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 식물 ID
 *     responses:
 *       200:
 *         description: 성장 성공
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
 *                   example: "식물이 성장했습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     plant:
 *                       $ref: '#/components/schemas/Plant'
 *                     isMaxStage:
 *                       type: boolean
 *                       example: false
 *                     isCompleted:
 *                       type: boolean
 *                       example: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/plants/collection:
 *   get:
 *     summary: 식물 도감 조회 (자녀 전용)
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 식물 도감 조회 성공
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
 *                       plantType:
 *                         $ref: '#/components/schemas/PlantType'
 *                       plants:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Plant'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * /api/plants/children/{childId}/current:
 *   get:
 *     summary: 부모가 자녀의 식물 조회
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: 자녀 ID
 *     responses:
 *       200:
 *         description: 자녀 식물 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Plant'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/plants/children/{childId}:
 *   get:
 *     summary: 자녀의 모든 식물 조회
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: 자녀 ID
 *     responses:
 *       200:
 *         description: 자녀 식물 목록 조회 성공
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
 *                     $ref: '#/components/schemas/Plant'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/plants/children/{childId}/collection:
 *   get:
 *     summary: 부모가 자녀의 식물 도감 조회
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: 자녀 ID
 *     responses:
 *       200:
 *         description: 자녀 식물 도감 조회 성공
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
 *                       plantType:
 *                         $ref: '#/components/schemas/PlantType'
 *                       plants:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Plant'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */