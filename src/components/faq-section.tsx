import type { GenerateFaqOutput } from '@/ai/flows/generate-faq';
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
import { HelpCircle } from 'lucide-react';

interface FaqSectionProps {
  faqData: GenerateFaqOutput;
}

export default function FaqSection({ faqData }: FaqSectionProps) {
  const { faqs } = faqData;
  const hasFaqs = faqs && faqs.length > 0;
  const { language } = useLanguage();
  const t = useTranslation(language);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('ai_generated_faqs')}</CardTitle>
        <CardDescription>
          {t('faq_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasFaqs ? (
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
            <HelpCircle className="h-10 w-10" />
            <p className="mt-4 font-semibold">{t('no_faqs_generated')}</p>
            <p className="mt-1 text-sm">
              {t('no_faqs_description')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
