
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-900/40 backdrop-blur-md p-6">
      <div className="bg-white rounded-[2.5rem] overflow-hidden w-full max-w-md flex flex-col shadow-2xl border border-pink-50">
        <div className="p-6 flex justify-between items-center border-b border-pink-50 bg-[#fffafa]">
          <h3 className="font-black text-xl text-pink-600">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full text-pink-300 hover:text-pink-500 hover:bg-pink-50 transition-all font-black">✕</button>
        </div>
        <div className="relative aspect-[3/4] bg-pink-50">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          {/* 櫻花裝飾遮罩框 */}
          <div className="absolute inset-0 border-[2rem] border-white/10 pointer-events-none"></div>
        </div>
        <div className="p-8 flex justify-center bg-[#fffafa]">
          <button 
            onClick={capture}
            className="w-20 h-20 rounded-full border-[6px] border-white bg-pink-400 hover:bg-pink-500 active:scale-90 transition-all shadow-[0_0_25px_-5px_rgba(249,168,212,0.8)] flex items-center justify-center"
          >
            <div className="w-8 h-8 rounded-full border-2 border-white/50"></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
