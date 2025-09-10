'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleGLogo, Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    setLoading(true);
    try {
      if (action === 'signIn') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
        toast({
          title: 'Account Created',
          description: "You've successfully signed up! You are now logged in.",
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Legalease AI</h1>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Understand Your Legal Documents
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in or create an account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-signin">Email</Label>
                <Input id="email-signin" type="email" placeholder="m@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signin">Password</Label>
                <Input id="password-signin" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
              </div>
              <Button onClick={() => handleAuthAction('signIn')} className="w-full" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-signup">Email</Label>
                <Input id="email-signup" type="email" placeholder="m@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Password</Label>
                <Input id="password-signup" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading}/>
              </div>
              <Button onClick={() => handleAuthAction('signUp')} className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            className="w-full"
            variant="outline"
            disabled={loading}
          >
            <GoogleGLogo className="mr-2 h-5 w-5" />
            Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
