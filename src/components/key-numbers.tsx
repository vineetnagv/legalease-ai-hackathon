import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from './ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { AnalysisResult } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { useTranslation } from '@/lib/translations';

interface KeyNumbersProps {
  keyNumbers: AnalysisResult['keyNumbers'];
}

export default function KeyNumbers({ keyNumbers }: KeyNumbersProps) {
  const hasNumbers = keyNumbers && keyNumbers.length > 0;
  const { language } = useLanguage();
  const t = useTranslation(language);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('key_numbers_dates')}</CardTitle>
        <CardDescription>
          {t('key_numbers_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasNumbers ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {keyNumbers.map(({ key, value }) => (
              <div
                key={key}
                className="flex flex-col justify-between rounded-lg border p-3"
              >
                <p className="text-sm font-medium text-muted-foreground">
                  {key}
                </p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-dashed border-2 p-12 text-center text-muted-foreground">
            <AlertTriangle className="h-10 w-10" />
            <p className="mt-4 font-semibold">{t('no_key_numbers_found')}</p>
            <p className="mt-1 text-sm">
              {t('no_key_numbers_description')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
