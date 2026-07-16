'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="rounded-lg bg-white px-3 py-1.5 text-xs"
    >
      로그아웃
    </Button>
  );
}
