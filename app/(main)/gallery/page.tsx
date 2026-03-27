// 强制动态渲染，避免 shuffle 导致的 hydration mismatch
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import GalleryContent from './GalleryContent';

export default function GalleryPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-60px)] flex items-center justify-center">
        <div className="text-on-surface-variant">加载中...</div>
      </div>
    }>
      <GalleryContent />
    </Suspense>
  );
}
