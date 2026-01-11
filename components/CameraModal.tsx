
import React, { useRef, useState, useCallback } from 'react';

interface CameraModalProps {
  onCapture: (image: string) => void;
  onClose: () => void;
  title: string;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("無法開啟相機，請檢查權限設定。");
    }
  }, []);

  React.useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [startCamera, stream]);

  const capture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg');
      onCapture(data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md flex flex-col">
        <div className="p-4 flex justify-between items-center border-b border-pink-50">
          <h3 className="font-bold text-lg text-pink-800">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-pink-500 transition-colors">✕</button>
        </div>
        <div className="relative aspect-[3/4] bg-black">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 flex justify-center">
          <button 
            onClick={capture}
            className="w-16 h-16 rounded-full border-4 border-pink-100 bg-pink-500 hover:bg-pink-600 active:scale-90 transition-all shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default CameraModal;