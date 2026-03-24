'use client';

import { useState } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import SubmitModal from '@/components/submit/SubmitModal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [showSubmit, setShowSubmit] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-surface">
      <Sidebar onSubmitClick={() => setShowSubmit(true)} />
      <main className="ml-64 h-screen overflow-y-auto custom-scrollbar bg-surface">
        <div className="min-h-full">
          {children}
        </div>
      </main>
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}
    </div>
  );
}
