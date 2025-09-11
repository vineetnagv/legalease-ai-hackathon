import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { FontProvider } from '@/contexts/font-size-context';
import { LanguageProvider } from '@/contexts/language-context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Legalease AI',
  description: 'Understand Your Legal Documents with Confidence.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FontProvider>
            <LanguageProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </LanguageProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
