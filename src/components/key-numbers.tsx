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

interface KeyNumbersProps {
  keyNumbers: AnalysisResult['keyNumbers'];
}

export default function KeyNumbers({ keyNumbers }: KeyNumbersProps) {
  const hasNumbers = keyNumbers && keyNumbers.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Key Numbers & Dates</CardTitle>
        <CardDescription>
          Important figures and dates automatically extracted from the
          document.
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
            <p className="mt-4 font-semibold">No Key Numbers Found</p>
            <p className="mt-1 text-sm">
              The AI could not automatically extract key numbers or dates from
              this document.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
