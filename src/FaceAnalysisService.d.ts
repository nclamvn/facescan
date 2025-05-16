export interface FaceAttributes {
  ethnicity?: {
    value: string;
    confidence: number;
  };
  skinstatus?: {
    dark_circle: number;
    stain: number;
    acne: number;
    health: number;
  };
  emotion?: {
    sadness: number;
    neutral: number;
    disgust: number;
    anger: number;
    surprise: number;
    fear: number;
    happiness: number;
  };
}

export interface FaceDetectionResult {
  faces?: Array<{
    attributes: FaceAttributes;
  }>;
}

export class FaceAnalysisService {
  constructor(apiUrl?: string);
  
  detectFace(imageBlob: Blob): Promise<FaceDetectionResult>;
  
  analyzeFace(faceToken: string): Promise<FaceDetectionResult>;
  
  extractEthnicity(faceAttributes: FaceAttributes): {
    ethnicity: string;
    confidence: number;
  };
  
  extractSkinHealth(faceAttributes: FaceAttributes): {
    skinHealth: string;
    confidence: number;
  };
  
  extractPhysicalState(faceAttributes: FaceAttributes): {
    physicalState: string;
    confidence: number;
  };
}

export function useFaceAnalysis(apiUrl?: string): FaceAnalysisService;
