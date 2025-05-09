/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 사용자 인증 및 계정 관리
 * 
 * /api/auth/parent/signup:
 *   post:
 *     summary: 부모 계정 회원가입
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "ParentUser"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "parent@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *     responses:
 *       201:
 *         description: 부모 계정 생성 성공
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
 *                   example: "부모 계정이 성공적으로 생성되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     userType:
 *                       type: string
 *                       enum: [PARENT]
 *                     parentProfileId:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 * 
 * /api/auth/child/signup:
 *   post:
 *     summary: 자녀 계정 회원가입
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "ChildUser"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "2010-05-15"
 *               parentCode:
 *                 type: string
 *                 description: 부모 연결 코드 (선택적)
 *                 example: "p-123456"
 *     responses:
 *       201:
 *         description: 자녀 계정 생성 성공
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
 *                   example: "자녀 계정이 성공적으로 생성되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     userType:
 *                       type: string
 *                       enum: [CHILD]
 *                     childProfileId:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 * 
 * /api/auth/login:
 *   post:
 *     summary: 사용자 로그인
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - userType
 *             properties:
 *               username:
 *                 type: string
 *                 example: "UserName"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *               userType:
 *                 type: string
 *                 enum: [PARENT, CHILD]
 *                 example: "PARENT"
 *     responses:
 *       200:
 *         description: 로그인 성공
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
 *                   example: "로그인에 성공했습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         userType:
 *                           type: string
 *                           enum: [PARENT, CHILD]
 *                         profileId:
 *                           type: string
 *                     token:
 *                       type: string
 *                       description: JWT 토큰
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: 로그인 실패
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
 *                   example: "비밀번호가 일치하지 않습니다."
 *       404:
 *         description: 사용자 찾을 수 없음
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
 *                   example: "사용자를 찾을 수 없습니다."
 * 
 * /api/auth/change-password:
 *   post:
 *     summary: 비밀번호 변경
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: "currentPassword123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
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
 *                   example: "비밀번호가 성공적으로 변경되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "비밀번호가 성공적으로 변경되었습니다."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: 인증 실패
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
 *                   example: "현재 비밀번호가 일치하지 않습니다."
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/auth/parent/connection-code:
 *   get:
 *     summary: 부모 연결 코드 생성
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 연결 코드 생성 성공
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
 *                   example: "부모 연결 코드가 생성되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "p-123456"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * /api/auth/child/connect-parent:
 *   post:
 *     summary: 자녀와 부모 연결
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentCode
 *             properties:
 *               parentCode:
 *                 type: string
 *                 example: "p-123456"
 *     responses:
 *       200:
 *         description: 부모와 연결 성공
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
 *                   example: "부모와 성공적으로 연결되었습니다."
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "부모와 성공적으로 연결되었습니다."
 *       400:
 *         description: 유효하지 않은 연결 코드
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
 *                   example: "유효하지 않은 부모 연결 코드입니다."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */