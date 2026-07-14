import WishlistPage from '@/views/publicEvents/WishlistPage';

export const metadata = {
  title: 'Your Wishlist',
  description: 'Events you saved on PXI.',
  robots: { index: false },
};

export default function Page() {
  return <WishlistPage />;
}
