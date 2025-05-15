// src/utils/imageUrl.ts 생성

/**
 * 식물 이미지 URL 생성 함수
 * @param imagePrefix 식물 유형의 이미지 접두사
 * @param stage 성장 단계
 * @returns 완전한 S3 이미지 URL
 */
export const getPlantImageUrl = (imagePrefix: string, stage: number): string => {
    return `https://growpromise-uploads.s3.ap-northeast-2.amazonaws.com/plant/${imagePrefix}_${stage}.png`;
  };
  
  /**
   * 식물 유형의 모든 성장 단계 이미지 URL 목록 생성
   * @param plantType 식물 유형 객체
   * @returns 모든 성장 단계의 이미지 URL 목록
   */
  export const getPlantStageImages = (plantType: any): string[] => {
    const urls: string[] = [];
    
    for (let stage = 1; stage <= plantType.growthStages; stage++) {
      urls.push(getPlantImageUrl(plantType.imagePrefix, stage));
    }
    
    return urls;
  };