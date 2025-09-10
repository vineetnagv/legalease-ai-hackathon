'use client';

import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleGLogo, Logo } from '@/components/icons';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Legalease AI</h1>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Understand Your Legal Documents with Confidence.
          </CardTitle>
          <p className="text-muted-foreground">
            Sign in securely to upload and analyze your contracts in minutes.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={signInWithGoogle}
            className="w-full"
            size="lg"
          >
            <GoogleGLogo className="mr-2 h-5 w-5" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
