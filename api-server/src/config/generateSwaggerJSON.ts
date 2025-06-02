import fs from 'fs';
import path from 'path';

// CommonJS 방식으로 가져오기
const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger 문서 생성 및 저장
 */
const generateSwaggerJSON = () => {
  // Swagger 기본 설정
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'KidsPlan API',
        version: '1.0.0',
        description: '부모와 아이를 위한 약속 관리 앱 API',
        contact: {
          name: 'KidsPlan Team'
        }
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:5000/api',
          description: '개발 서버'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    },
    // API 경로 패턴
    apis: [
      path.resolve(__dirname, '../docs/*.js'),
      path.resolve(__dirname, '../api/**/*.routes.ts'),
      path.resolve(__dirname, '../api/**/*.controller.ts')
    ]
  };

  // Swagger 스펙 문서 생성
  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  // JSON 파일로 저장
  const outputPath = path.resolve(__dirname, '../../swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));

  console.log(`Swagger JSON 파일이 생성되었습니다: ${outputPath}`);
};

// 실행
generateSwaggerJSON();