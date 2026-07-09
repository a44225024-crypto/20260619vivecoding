'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-50"
    >
      로그아웃
    </button>
  );
}
