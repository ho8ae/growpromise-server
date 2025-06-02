import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error.middleware';
import * as plantService from './plant.service';

/**
 * 모든 식물 유형 조회
 * @route GET /api/plants/types
 */
export const getAllPlantTypes = asyncHandler(async (req: Request, res: Response) => {
  const childId = req.query.childId as string;
  
  const plantTypes = await plantService.getAllPlantTypes(childId);
  
  res.status(200).json({
    success: true,
    data: plantTypes
  });
});

/**
 * 식물 유형 상세 조회
 * @route GET /api/plants/types/:id
 */
export const getPlantTypeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const plantType = await plantService.getPlantTypeById(id);
  
  res.status(200).json({
    success: true,
    data: plantType
  });
});

/**
 * 현재 자녀의 식물 조회
 * @route GET /api/plants/current
 */
export const getCurrentPlant = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  // 자녀 프로필 ID 가져오기
  const childProfileId = req.user.profileId;
  
  if (!childProfileId) {
    return res.status(400).json({
      success: false,
      message: '프로필 ID를 찾을 수 없습니다.'
    });
  }
  
  const currentPlant = await plantService.getCurrentPlant(childProfileId);
  
  res.status(200).json({
    success: true,
    data: currentPlant
  });
});

/**
 * 부모가 자녀의 식물 조회
 * @route GET /api/plants/children/:childId/current
 */
export const getChildCurrentPlant = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { childId } = req.params;
  
  if (!childId) {
    return res.status(400).json({
      success: false,
      message: '자녀 ID는 필수입니다.'
    });
  }
  
  const currentPlant = await plantService.getCurrentPlant(childId);
  
  res.status(200).json({
    success: true,
    data: currentPlant
  });
});

/**
 * 자녀의 모든 식물 조회
 * @route GET /api/plants/children/:childId
 */
export const getChildPlants = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { childId } = req.params;
  
  if (!childId) {
    return res.status(400).json({
      success: false,
      message: '자녀 ID는 필수입니다.'
    });
  }
  
  const plants = await plantService.getChildPlants(childId);
  
  res.status(200).json({
    success: true,
    data: plants
  });
});

/**
 * 새 식물 시작하기
 * @route POST /api/plants/start
 */
export const startNewPlant = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { plantTypeId, plantName } = req.body;
  
  // 자녀 프로필 ID 가져오기
  const childProfileId = req.user.profileId;
  
  if (!childProfileId) {
    return res.status(400).json({
      success: false,
      message: '프로필 ID를 찾을 수 없습니다.'
    });
  }
  
  const newPlant = await plantService.startNewPlant(childProfileId, plantTypeId, plantName);
  
  res.status(201).json({
    success: true,
    message: '새 식물을 시작했습니다.',
    data: newPlant
  });
});

/**
 * 식물에 물주기
 * @route POST /api/plants/:id/water
 */
export const waterPlant = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      message: '식물 ID는 필수입니다.'
    });
  }
  
  const result = await plantService.waterPlant(id);
  
  res.status(200).json({
    success: true,
    message: '식물에 물을 주었습니다.',
    data: result
  });
});

/**
 * 식물 성장 단계 올리기
 * @route POST /api/plants/:id/grow
 */
export const growPlant = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      message: '식물 ID는 필수입니다.'
    });
  }
  
  const result = await plantService.advancePlantStage(id);
  
  let message = '식물이 성장했습니다.';
  if (result.isCompleted) {
    message = '식물이 완전히 성장했습니다! 축하합니다!';
  } else if (result.isMaxStage) {
    message = '식물이 최대 성장 단계에 도달했습니다!';
  }
  
  res.status(200).json({
    success: true,
    message,
    data: result
  });
});

/**
 * 식물 도감 조회
 * @route GET /api/plants/collection
 */
export const getPlantCollection = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  // 자녀 프로필 ID 가져오기
  const childProfileId = req.user.profileId;
  
  if (!childProfileId) {
    return res.status(400).json({
      success: false,
      message: '프로필 ID를 찾을 수 없습니다.'
    });
  }
  
  const collection = await plantService.getPlantCollection(childProfileId);
  
  res.status(200).json({
    success: true,
    data: collection
  });
});

/**
 * 부모가 자녀의 식물 도감 조회
 * @route GET /api/plants/children/:childId/collection
 */
export const getChildPlantCollection = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { childId } = req.params;
  
  if (!childId) {
    return res.status(400).json({
      success: false,
      message: '자녀 ID는 필수입니다.'
    });
  }
  
  const collection = await plantService.getPlantCollection(childId);
  
  res.status(200).json({
    success: true,
    data: collection
  });
});

/**
 * 식물 유형 추가 (관리자용)
 * @route POST /api/plants/types
 */
export const createPlantType = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  // TODO: 관리자 권한 확인
  
  const plantTypeData = req.body;
  
  const newPlantType = await plantService.createPlantType(plantTypeData);
  
  res.status(201).json({
    success: true,
    message: '새 식물 유형이 생성되었습니다.',
    data: newPlantType
  });
});

/**
 * 랜덤 식물 뽑기
 * @route POST /api/plants/draw
 */
export const drawRandomPlant = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  const { packType } = req.body; // basic, premium, special 등의 팩 타입
  
  // 자녀 프로필 ID 가져오기
  const childProfileId = req.user.profileId;
  
  if (!childProfileId) {
    return res.status(400).json({
      success: false,
      message: '프로필 ID를 찾을 수 없습니다.'
    });
  }
  
  const drawResult = await plantService.drawRandomPlant(childProfileId, packType);
  
  res.status(200).json({
    success: true,
    message: '새로운 식물을 획득했습니다!',
    data: drawResult
  });
});

/**
 * 소유한 식물 유형 목록 조회
 * @route GET /api/plants/inventory
 */
export const getPlantInventory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  // 자녀 프로필 ID 가져오기
  const childProfileId = req.user.profileId;
  
  if (!childProfileId) {
    return res.status(400).json({
      success: false,
      message: '프로필 ID를 찾을 수 없습니다.'
    });
  }
  
  const inventory = await plantService.getPlantInventory(childProfileId);
  
  res.status(200).json({
    success: true,
    data: inventory
  });
});


/**
 * 인벤토리에서 식물 제거
 * @route DELETE /api/plants/inventory/:plantTypeId
 */
export const removeFromInventory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }
  
  // 자녀 프로필 ID 가져오기
  const childProfileId = req.user.profileId;
  
  if (!childProfileId) {
    return res.status(400).json({
      success: false,
      message: '프로필 ID를 찾을 수 없습니다.'
    });
  }
  
  const { plantTypeId } = req.params;
  
  if (!plantTypeId) {
    return res.status(400).json({
      success: false,
      message: '식물 유형 ID는 필수입니다.'
    });
  }
  
  const result = await plantService.removeFromInventory(childProfileId, plantTypeId);
  
  res.status(200).json({
    success: true,
    message: '인벤토리에서 식물이 제거되었습니다.',
    data: result
  });
});

export default {
  getAllPlantTypes,
  getPlantTypeById,
  getCurrentPlant,
  getChildCurrentPlant,
  getChildPlants,
  startNewPlant,
  waterPlant,
  growPlant,
  getPlantCollection,
  getChildPlantCollection,
  createPlantType
};