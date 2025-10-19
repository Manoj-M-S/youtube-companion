'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/app/components/ui/button';
import { LogOut, LogIn } from 'lucide-react';

export default function AuthButton() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return null;
  
  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:block">
          {session.user?.email}
        </span>
        <Button onClick={() => signOut()} variant="destructive" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }
  
  return (
    <Button onClick={() => signIn('google')}>
      <LogIn className="mr-2 h-4 w-4" />
      Sign in with Google
    </Button>
  );
}
