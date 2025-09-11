import type { DetectMissingClausesOutput } from '@/ai/flows/detect-missing-clauses';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';
import { useTranslation } from '@/lib/translations';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface MissingClausesProps {
  missingClauses: DetectMissingClausesOutput;
}

export default function MissingClauses({ missingClauses }: MissingClausesProps) {
  const hasMissingClauses = missingClauses && missingClauses.length > 0;
  const { language } = useLanguage();
  const t = useTranslation(language);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('missing_clause_detector')}</CardTitle>
        <CardDescription>
            {t('missing_clause_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasMissingClauses ? (
          <Accordion type="single" collapsible className="w-full">
            {missingClauses.map((clause, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                    <div className='flex items-center gap-3'>
                        <AlertTriangle className="h-5 w-5 text-risk-high" />
                        <span className="font-medium">{clause.clauseName}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                   <div className="space-y-1">
                     <h4 className="font-semibold">Description</h4>
                     <p className="text-muted-foreground">{clause.description}</p>
                   </div>
                    <div className="space-y-1 rounded-md border border-destructive/50 bg-destructive/5 p-3">
                        <h4 className="font-semibold text-destructive">{t('risk_of_absence')}</h4>
                        <p className="text-destructive/80">{clause.risk}</p>
                    </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-green-500/50 bg-green-500/5 p-12 text-center text-green-700 dark:text-green-300">
            <ShieldCheck className="h-10 w-10" />
            <p className="mt-4 font-semibold">{t('no_missing_clauses_found')}</p>
            <p className="mt-1 text-sm">
              {t('no_missing_clauses_description')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
