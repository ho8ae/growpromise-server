import type { Express } from 'express';
import path from 'path';

// ES Module 방식으로 사용할 수 없는 경우 require로 가져옵니다
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Swagger 설정
 */
export const setupSwagger = (app: Express): void => {
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
          url: process.env.API_URL || 'http://localhost:3000/api',
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
    // API 경로 패턴 (src/docs 폴더 내의 모든 swagger.js 파일 포함)
    apis: [
      path.resolve(__dirname, '../docs/*.js'),
      path.resolve(__dirname, '../api/**/*.routes.ts'),
      path.resolve(__dirname, '../api/**/*.controller.ts')
    ]
  };

  // Swagger 스펙 문서 생성
  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  // Swagger UI 설정
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'KidsPlan API 문서',
    customfavIcon: '/favicon.ico'
  }));

  // Swagger JSON 엔드포인트
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger 문서가 설정되었습니다. /api-docs 경로에서 확인하세요.');
};