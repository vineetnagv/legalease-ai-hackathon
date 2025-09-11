import type { ExplainClausesOutput } from '@/ai/flows/explain-clauses';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/language-context';
import { useTranslation } from '@/lib/translations';

interface ClauseBreakdownProps {
  clauses: ExplainClausesOutput;
}

/**
 * Renders the explanation text, wrapping identified jargon terms
 * in a tooltip for the "Jargon Buster" feature.
 */
function JargonBuster({
  explanation,
  jargonTerms,
}: {
  explanation: string;
  jargonTerms: string[];
}) {
  if (!jargonTerms || jargonTerms.length === 0) {
    return <p className="text-foreground/90">{explanation}</p>;
  }
  
  // Create a case-insensitive regex to find all jargon terms
  const regex = new RegExp(`(${jargonTerms.join('|')})`, 'gi');
  const parts = explanation.split(regex);

  return (
    <p className="text-foreground/90">
      {parts.map((part, i) => {
        const isJargon = jargonTerms.some(
          (term) => part.toLowerCase() === term.toLowerCase()
        );

        if (isJargon) {
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <span className="cursor-help rounded bg-primary/10 px-1 py-0.5 font-semibold text-primary underline decoration-dotted decoration-primary/50">
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is considered legal jargon.</p>
              </TooltipContent>
            </Tooltip>
          );
        }
        return part;
      })}
    </p>
  );
}

export default function ClauseBreakdown({ clauses }: ClauseBreakdownProps) {
  const { language } = useLanguage();
  const t = useTranslation(language);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('clause_breakdown')}</CardTitle>
        <CardDescription>
          {t('clause_breakdown_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Accordion type="single" collapsible className="w-full">
            {clauses.map((clause, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-medium">
                    Clause {index + 1}:{' '}
                    <span className="font-normal text-muted-foreground truncate">
                      {clause.original_text.substring(0, 80)}...
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{t('original_clause')}</h4>
                      <div className="prose prose-sm max-w-none rounded-md border bg-muted/50 p-3 text-muted-foreground">
                        <p>{clause.original_text}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{t('plain_english_explanation')}</h4>
                       <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                        <JargonBuster
                            explanation={clause.plain_english_explanation}
                            jargonTerms={clause.jargon_terms}
                        />
                       </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
