'use client';

import { useAuth } from '@/lib/firebase/auth-context';
import LoginPage from '@/components/login-page';
import Dashboard from '@/components/dashboard';
import { LoaderCircle } from 'lucide-react';

export function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return <LoginPage />;
}
