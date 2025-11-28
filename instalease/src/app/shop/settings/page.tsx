'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShopSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/shop/settings/notifications');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
