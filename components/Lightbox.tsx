'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  urls: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Lightbox({ 
  urls, 
  currentIndex, 
  onClose, 
  onPrev, 
  onNext 
}: LightboxProps) {
  const [mounted, setMounted] = useState(false);
  const currentUrl = urls[currentIndex];
  const isVideo = currentUrl.match(/\.(mp4|mov|webm|avi)$/i);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 键盘导航
  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, onClose, onPrev, onNext]);
  
  if (!mounted) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button 
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
        onClick={onClose}
      >
        <X size={24} />
      </button>
      
      {/* 计数器 */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm">
        {currentIndex + 1} / {urls.length}
      </div>
      
      {/* 上一张 */}
      {urls.length > 1 && (
        <button 
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        >
          <ChevronLeft size={32} />
        </button>
      )}
      
      {/* 下一张 */}
      {urls.length > 1 && (
        <button 
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        >
          <ChevronRight size={32} />
        </button>
      )}
      
      {/* 内容区域 */}
      <div 
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video 
            src={currentUrl}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] object-contain"
          />
        ) : (
          <img 
            src={currentUrl}
            alt={`Media ${currentIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain"
          />
        )}
      </div>
    </div>
  );
}
