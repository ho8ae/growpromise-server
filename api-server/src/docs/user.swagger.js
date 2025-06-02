/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 사용자 프로필 및 관계 관리
 * 
 * /api/users/profile:
 *   get:
 *     summary: 사용자 프로필 정보 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 정보 조회 성공
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
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     userType:
 *                       type: string
 *                       enum: [PARENT, CHILD]
 *                     profileImage:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     parentProfile:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         children:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               child:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   user:
 *                                     type: object
 *                                     properties:
 *                                       username:
 *                                         type: string
 *                                       profileImage:
 *                                         type: string
 *                     childProfile:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         birthDate:
 *                           type: string
 *                           format: date
 *                         characterStage:
 *                           type: integer
 *                         parents:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               parent:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   user:
 *                                     type: object
 *                                     properties:
 *                                       username:
 *                                         type: string
 *                                       profileImage:
 *                                         type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   
 *   patch:
 *     summary: 사용자 프로필 정보 업데이트
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "NewUsername"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newemail@example.com"
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "2010-05-15"
 *     responses:
 *       200:
 *         description: 프로필 업데이트 성공
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
 *                   example: "프로필이 성공적으로 업데이트되었습니다."
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/users/profile/image:
 *   patch:
 *     summary: 프로필 이미지 업데이트
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 프로필 이미지 파일
 *     responses:
 *       200:
 *         description: 프로필 이미지 업데이트 성공
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
 *                   example: "프로필 이미지가 성공적으로 업데이트되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *       400:
 *         description: 이미지 없음
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
 *                   example: "프로필 이미지가 필요합니다."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/users/children:
 *   get:
 *     summary: 부모의 자녀 목록 조회 (부모용)
 *     tags: [Users]
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/users/parents:
 *   get:
 *     summary: 자녀의 부모 목록 조회 (자녀용)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 부모 목록 조회 성공
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
 *                       parent:
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
 *                               email:
 *                                 type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/users/{id}:
 *   get:
 *     summary: 사용자 상세 정보 조회 (관계 필요)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 상세 정보 조회 성공
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
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     userType:
 *                       type: string
 *                       enum: [PARENT, CHILD]
 *                     profileImage:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     parentProfile:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                     childProfile:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         birthDate:
 *                           type: string
 *                           format: date
 *                         characterStage:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */