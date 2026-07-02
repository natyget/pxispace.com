'use client';

import React from 'react';
import SectionShell from '@/components/marketing/SectionShell';
import InstaShareShowcase from '@/components/marketing/InstaShareShowcase';

/** Chapter: the rebuilt one-tap share-to-Instagram flow (live DOM component). */
export default function ChapterShare() {
  return (
    <SectionShell eyebrow="Share it" pad="loose">
      <div className="mt-6">
        <InstaShareShowcase />
      </div>
    </SectionShell>
  );
}
