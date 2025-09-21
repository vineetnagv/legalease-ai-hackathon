'use client';

import { Logo } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useTranslation } from "@/lib/translations";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";


export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language } = useLanguage();
  const t = useTranslation(language);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">Legalease AI</span>
        </div>
        <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline">
                <Link href="/">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t('back_to_app')}
                </Link>
            </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-4xl">
            {children}
        </div>
      </main>
    </>
  );
}
