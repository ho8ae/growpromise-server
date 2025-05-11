import express from 'express';
import * as plantController from './plant.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticate, requireParent, requireChild, checkParentChildRelationship } from '../../middleware/auth.middleware';
import { 
  startPlantSchema, 
  plantTypeSchema
} from './plant.validation';

const router = express.Router();

// 식물 유형 관련 라우트
router.get('/types', plantController.getAllPlantTypes);
router.get('/types/:id', plantController.getPlantTypeById);
router.post('/types', authenticate, validate(plantTypeSchema), plantController.createPlantType);

// 자녀의 식물 관련 라우트
router.get('/current', authenticate, requireChild, plantController.getCurrentPlant);
router.post('/start', authenticate, requireChild, validate(startPlantSchema), plantController.startNewPlant);
router.post('/:id/water', authenticate, requireChild, plantController.waterPlant);
router.post('/:id/grow', authenticate, requireChild, plantController.growPlant);
router.get('/collection', authenticate, requireChild, plantController.getPlantCollection);

// 부모가 자녀의 식물 조회 관련 라우트
router.get('/children/:childId/current', authenticate, requireParent, checkParentChildRelationship, plantController.getChildCurrentPlant);
router.get('/children/:childId', authenticate, requireParent, checkParentChildRelationship, plantController.getChildPlants);
router.get('/children/:childId/collection', authenticate, requireParent, checkParentChildRelationship, plantController.getChildPlantCollection);

export default router;