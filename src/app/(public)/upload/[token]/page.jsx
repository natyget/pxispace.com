import PhotographerUploadView from '@/views/public/PhotographerUploadView';

export const dynamic = 'force-dynamic';

export default async function PhotographerUploadPage({ params }) {
  const { token } = await params;
  return <PhotographerUploadView token={token} />;
}
