'use client';

import AppOpenBanner from '@/components/links/AppOpenBanner';

/**
 * Dismissible "Open in PXI" banner for the public post page.
 * `pxi://p/:id` opens the native app when installed; otherwise the banner falls
 * back to the App Store / Play Store after a short timeout.
 */
export default function PublicPostBottomBar({ postId }) {
  return (
    <AppOpenBanner
      deepLinkUrl={postId ? `pxi://p/${postId}` : null}
      title="Open in PXI"
      subtitle="Sign in to unlock private posts and react in the app"
      storageKey={`pxi_app_banner_post_${postId || 'unknown'}_dismissed`}
    />
  );
}
