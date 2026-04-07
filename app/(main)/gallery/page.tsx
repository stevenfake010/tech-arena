// 强制动态渲染，完全禁用服务端渲染
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import GalleryContent from './GalleryContent';

export default function GalleryPage() {
  return <GalleryContent />;
}
