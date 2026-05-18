import ChildSafety from '@/views/ChildSafety';

export const metadata = {
  title: 'Child Safety Standards',
  description:
    'PXI Studio\'s standards and practices for preventing child sexual abuse and exploitation (CSAE).',
  alternates: { canonical: 'https://pxispace.com/child-safety' },
};

export default function ChildSafetyPage() {
  return <ChildSafety />;
}
