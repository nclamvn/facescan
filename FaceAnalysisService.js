import { useState } from 'react';

export class FaceAnalysisService {
  constructor(apiUrl = 'http://localhost:3000/api') {
    this.apiUrl = apiUrl;
  }

  async detectFace(imageBlob) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);

      const response = await fetch(`${this.apiUrl}/detect`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to detect face');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in face detection:', error);
      throw error;
    }
  }

  async analyzeFace(faceToken) {
    try {
      const response = await fetch(`${this.apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ face_token: faceToken })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze face');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in face analysis:', error);
      throw error;
    }
  }

  // Phương thức trích xuất thông tin nhân chủng học
  extractEthnicity(faceAttributes) {
    if (!faceAttributes || !faceAttributes.ethnicity) {
      return { ethnicity: 'Không xác định', confidence: 0 };
    }

    const ethnicity = faceAttributes.ethnicity.value;
    const confidence = faceAttributes.ethnicity.confidence;
    
    // Chuyển đổi sang tiếng Việt
    const ethnicityMap = {
      'ASIAN': 'Châu Á',
      'WHITE': 'Châu Âu',
      'BLACK': 'Châu Phi',
      'INDIA': 'Nam Á'
    };

    return {
      ethnicity: ethnicityMap[ethnicity] || ethnicity,
      confidence: confidence
    };
  }

  // Phương thức trích xuất thông tin sức khỏe làn da
  extractSkinHealth(faceAttributes) {
    if (!faceAttributes || !faceAttributes.skinstatus) {
      return { skinHealth: 'Không xác định', confidence: 0 };
    }

    const skinStatus = faceAttributes.skinstatus;
    
    // Tính toán trạng thái da tổng thể dựa trên các chỉ số
    const healthScore = 100 - (
      (skinStatus.dark_circle || 0) + 
      (skinStatus.stain || 0) + 
      (skinStatus.acne || 0) + 
      (skinStatus.health || 0)
    ) / 4;

    let skinHealth = 'Khỏe mạnh';
    if (healthScore < 40) skinHealth = 'Cần cải thiện';
    else if (healthScore < 60) skinHealth = 'Trung bình';
    else if (healthScore < 80) skinHealth = 'Tốt';

    return {
      skinHealth,
      confidence: healthScore / 100
    };
  }

  // Phương thức trích xuất thông tin trạng thái thể chất
  extractPhysicalState(faceAttributes) {
    if (!faceAttributes || !faceAttributes.emotion) {
      return { physicalState: 'Không xác định', confidence: 0 };
    }

    const emotion = faceAttributes.emotion;
    
    // Đánh giá trạng thái thể chất dựa trên cảm xúc
    let physicalState = 'Khỏe mạnh';
    let confidence = 0.7;
    
    if (emotion.sadness > 50 || emotion.anger > 50 || emotion.fear > 50) {
      physicalState = 'Căng thẳng';
      confidence = Math.max(emotion.sadness, emotion.anger, emotion.fear) / 100;
    } else if (emotion.neutral > 70) {
      physicalState = 'Bình thường';
      confidence = emotion.neutral / 100;
    } else if (emotion.happiness > 50) {
      physicalState = 'Khỏe mạnh';
      confidence = emotion.happiness / 100;
    }

    return {
      physicalState,
      confidence
    };
  }
}

// Hook để sử dụng FaceAnalysisService trong các component React
export function useFaceAnalysis(apiUrl = 'http://localhost:3000/api') {
  const [service] = useState(new FaceAnalysisService(apiUrl));
  return service;
}
