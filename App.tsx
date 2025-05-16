import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';
import { useFaceAnalysis } from './FaceAnalysisService';

interface AnalysisResults {
  age?: number;
  gender?: string;
  genderProbability?: number;
  expression?: string;
  ethnicity?: string;
  skinHealth?: string;
  physicalState?: string;
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [advancedFeaturesLoading, setAdvancedFeaturesLoading] = useState(false);
  const [isProcessingFacepp, setIsProcessingFacepp] = useState(false);
  const [faceppError, setFaceppError] = useState<string | null>(null);
  
  // Sử dụng hook để lấy service phân tích khuôn mặt
  const faceAnalysisService = useFaceAnalysis();

  useEffect(() => {
    async function loadModels() {
      const MODEL_URL = '/models'; // Path to the models in the public folder
      try {
        console.log('Loading models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
        setLoadingModels(false);
        console.log('Models loaded successfully');
      } catch (e) {
        console.error('Error loading models:', e);
        setError('Không thể tải các mô hình AI. Vui lòng làm mới trang và thử lại.');
        setLoadingModels(false);
      }
    }
    loadModels();
  }, []);

  useEffect(() => {
    async function setupCamera() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          console.log('Setting up camera...');
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => {
                console.log('Camera playing');
                setIsCameraReady(true);
              }).catch(playError => {
                console.error('Error playing video:', playError);
                setError('Không thể phát video từ camera.');
              });
            };
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          if (err instanceof Error && err.name === 'NotAllowedError') {
            setError('Bạn đã từ chối quyền truy cập camera. Vui lòng cấp quyền và làm mới trang.');
          } else {
            setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập, thiết bị và làm mới trang.');
          }
        }
      } else {
        setError('Trình duyệt của bạn không hỗ trợ truy cập camera.');
      }
    }
    if (!loadingModels && !error) {
        setupCamera();
    }
  }, [loadingModels, error]);

  useEffect(() => {
    let intervalId: number | undefined;
    let faceppIntervalId: number | undefined;
    
    if (videoRef.current && canvasRef.current && !loadingModels && !error && isCameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const handleResize = () => {
        if(video.videoWidth > 0 && video.videoHeight > 0){
            const displaySize = { width: video.clientWidth, height: video.clientHeight };
            faceapi.matchDimensions(canvas, displaySize);
        }
      };

      video.addEventListener('loadeddata', handleResize);
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial call

      // Phát hiện khuôn mặt và phân tích cơ bản với face-api.js
      intervalId = window.setInterval(async () => {
        if (video.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
          const displaySize = { width: video.clientWidth, height: video.clientHeight };
          if (displaySize.width === 0 || displaySize.height === 0) return; // Skip if video not sized
          
          if(canvas.width !== displaySize.width || canvas.height !== displaySize.height){
            faceapi.matchDimensions(canvas, displaySize);
          }

          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender();

          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const context = canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

            resizedDetections.forEach(detection => {
              const { age, gender, genderProbability } = detection;
              const genderText = `${gender} (${Math.round(genderProbability * 100)}%)`;
              const ageText = `${Math.round(age)} tuổi`;
              new faceapi.draw.DrawTextField(
                [genderText, ageText],
                detection.detection.box.bottomLeft
              ).draw(canvas);
            });
          }

          if (detections && detections.length > 0) {
            const { age, gender, genderProbability, expressions } = detections[0];
            // Sử dụng type assertion để tránh lỗi TypeScript
            const expressionsObj = expressions as unknown as Record<string, number>;
            const primaryExpression = Object.keys(expressionsObj).reduce((a, b) => 
              expressionsObj[a] > expressionsObj[b] ? a : b
            );
            
            // Cập nhật kết quả phân tích cơ bản
            setAnalysisResults(prevResults => ({
              ...prevResults,
              age: Math.round(age),
              gender: gender,
              genderProbability: Math.round(genderProbability * 100),
              expression: primaryExpression,
            }));
          } else {
            setAnalysisResults(null); // Clear results if no face detected
          }
        }
      }, 200); // Run detection every 200ms for balance
      
      // Phân tích nâng cao với Face++ API (ít thường xuyên hơn để tiết kiệm API calls)
      faceppIntervalId = window.setInterval(async () => {
        if (video.readyState >= 3 && !isProcessingFacepp) {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }));
            
          if (detections && detections.length > 0) {
            try {
              setIsProcessingFacepp(true);
              setAdvancedFeaturesLoading(true);
              
              // Tạo canvas tạm thời để cắt khuôn mặt
              const tempCanvas = document.createElement('canvas');
              const tempContext = tempCanvas.getContext('2d');
              if (!tempContext) {
                throw new Error('Could not get canvas context');
              }
              
              const box = detections[0].box;
              
              // Đảm bảo kích thước hợp lệ
              const width = Math.max(box.width, 48);
              const height = Math.max(box.height, 48);
              
              tempCanvas.width = width;
              tempCanvas.height = height;
              tempContext.drawImage(
                video, 
                box.x, box.y, box.width, box.height,
                0, 0, width, height
              );
              
              // Chuyển đổi canvas thành blob
              const blob = await new Promise<Blob | null>(resolve => tempCanvas.toBlob(resolve, 'image/jpeg'));
              
              if (!blob) {
                throw new Error('Failed to create image blob');
              }
              
              // Gọi API Face++
              const faceResult = await faceAnalysisService.detectFace(blob);
              
              if (faceResult.faces && faceResult.faces.length > 0) {
                const faceAttributes = faceResult.faces[0].attributes;
                
                // Trích xuất thông tin nâng cao
                const ethnicityResult = faceAnalysisService.extractEthnicity(faceAttributes);
                const skinHealthResult = faceAnalysisService.extractSkinHealth(faceAttributes);
                const physicalStateResult = faceAnalysisService.extractPhysicalState(faceAttributes);
                
                // Cập nhật kết quả phân tích nâng cao
                setAnalysisResults(prevResults => ({
                  ...prevResults,
                  ethnicity: ethnicityResult.ethnicity,
                  skinHealth: skinHealthResult.skinHealth,
                  physicalState: physicalStateResult.physicalState,
                }));
                
                setFaceppError(null);
              }
            } catch (err) {
              console.error('Error analyzing with Face++ API:', err);
              setFaceppError('Không thể kết nối đến Face++ API. Đang sử dụng kết quả mô phỏng.');
              
              // Fallback to simulated results if API fails
              setAnalysisResults(prevResults => ({
                ...prevResults,
                ethnicity: 'Châu Á (mô phỏng)',
                skinHealth: 'Khỏe mạnh (mô phỏng)',
                physicalState: 'Bình thường (mô phỏng)',
              }));
            } finally {
              setAdvancedFeaturesLoading(false);
              setIsProcessingFacepp(false);
            }
          }
        }
      }, 3000); // Run Face++ analysis every 3 seconds to avoid excessive API calls
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (faceppIntervalId) {
        clearInterval(faceppIntervalId);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('resize', handleResize); 
      if(videoRef.current) videoRef.current.removeEventListener('loadeddata', handleResize);
    };
  }, [loadingModels, error, isCameraReady, faceAnalysisService, isProcessingFacepp]);

  const getMentalState = (expression?: string) => {
    if (!expression) return '--';
    switch (expression) {
      case 'happy': return 'Vui vẻ';
      case 'sad': return 'Buồn';
      case 'angry': return 'Tức giận';
      case 'surprised': return 'Ngạc nhiên';
      case 'fearful': return 'Sợ hãi';
      case 'disgusted': return 'Ghê tởm';
      case 'neutral': return 'Trung tính';
      default: return expression;
    }
  };

  const handleResize = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0 && canvasRef.current) {
      const displaySize = { width: videoRef.current.clientWidth, height: videoRef.current.clientHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-2 sm:p-4 font-sans">
      <header className="w-full max-w-3xl text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-teal-400">Phân tích Khuôn mặt Thông minh</h1>
        <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Xác định giới tính, tuổi tác, cảm xúc và các đặc điểm khác.</p>
      </header>

      <main className="w-full max-w-3xl flex flex-col lg:flex-row gap-4 sm:gap-8">
        {/* Camera View Section */}
        <section className="lg:w-1/2 bg-gray-800 p-3 sm:p-4 rounded-lg shadow-xl flex flex-col items-center justify-center relative aspect-[4/3]">
          {loadingModels && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-85 flex flex-col items-center justify-center z-10 rounded-lg">
              <svg className="animate-spin h-10 w-10 text-teal-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg">Đang tải mô hình AI...</p>
            </div>
          )}
          {advancedFeaturesLoading && (
            <div className="absolute top-2 right-2 bg-teal-600 text-white text-xs px-2 py-1 rounded-full z-10">
              Đang phân tích nâng cao...
            </div>
          )}
          {error && !loadingModels && (
            <div className="w-full h-full bg-gray-700 rounded-lg flex flex-col items-center justify-center text-red-400 p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm sm:text-base">{error}</p>
            </div>
          )}
          {!error && !loadingModels && (
            <div className="relative w-full h-full">
                <video ref={videoRef} className="w-full h-full rounded-lg object-cover transform -scale-x-100" playsInline muted autoPlay/>
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
            </div>
          )}
           {!error && !loadingModels && !isCameraReady && (
             <div className="w-full h-full bg-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 sm:h-24 sm:w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="mt-2 text-sm sm:text-base">Đang khởi tạo camera...</p>
            </div>
           )}
        </section>

        {/* Analysis Results Section */}
        <section className="lg:w-1/2 bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-teal-300 border-b border-gray-700 pb-2">Kết quả Phân tích</h2>
          
          {faceppError && (
            <div className="mb-4 p-2 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded text-yellow-400 text-xs">
              <p>{faceppError}</p>
            </div>
          )}
          
          <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
            <div>
              <h3 className="font-medium text-gray-300">Giới tính:</h3>
              <p id="gender-result" className="text-teal-400 text-base sm:text-lg">{analysisResults?.gender ? `${analysisResults.gender === 'male' ? 'Nam'
(Content truncated due to size limit. Use line ranges to read in chunks)