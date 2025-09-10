'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleGLogo, Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center text-sm ${met ? 'text-green-600' : 'text-muted-foreground'}`}>
        {met ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
        {text}
    </div>
);

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const passwordValidation = useMemo(() => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough].filter(Boolean).length;
    const progress = (strength / 5) * 100;

    return {
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isLongEnough,
      isValid: strength === 5,
      progress,
    };
  }, [password]);


  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    setLoading(true);
    try {
      if (action === 'signIn') {
        await signInWithEmail(email, password);
      } else {
        if (!passwordValidation.isValid) {
            toast({
                variant: 'destructive',
                title: 'Weak Password',
                description: 'Please ensure your password meets all the requirements.',
            });
            setLoading(false);
            return;
        }
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
          <Tabs defaultValue="signin" onValueChange={() => { setEmail(''); setPassword(''); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-4 pt-4">
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
            <TabsContent value="signup" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email-signup">Email</Label>
                <Input id="email-signup" type="email" placeholder="m@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Password</Label>
                <Input id="password-signup" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading}/>
              </div>
               {password.length > 0 && (
                <div className="space-y-2">
                    <Progress value={passwordValidation.progress} className="h-2" />
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1'>
                        <PasswordRequirement met={passwordValidation.isLongEnough} text="At least 8 characters" />
                        <PasswordRequirement met={passwordValidation.hasUpperCase} text="One uppercase letter" />
                        <PasswordRequirement met={passwordValidation.hasLowerCase} text="One lowercase letter" />
                        <PasswordRequirement met={passwordValidation.hasNumber} text="One number" />
                        <PasswordRequirement met={passwordValidation.hasSpecialChar} text="One special character" />
                    </div>
                </div>
              )}
              <Button onClick={() => handleAuthAction('signUp')} className="w-full" disabled={loading || !passwordValidation.isValid}>
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
