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
import { HelpCircle } from 'lucide-react';

interface FaqSectionProps {
  faqData: GenerateFaqOutput;
}

export default function FaqSection({ faqData }: FaqSectionProps) {
  const { faqs } = faqData;
  const hasFaqs = faqs && faqs.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">AI-Generated FAQs</CardTitle>
        <CardDescription>
          Frequently asked questions and "what if" scenarios based on your
          document.
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
            <p className="mt-4 font-semibold">No FAQs Generated</p>
            <p className="mt-1 text-sm">
              The AI could not automatically generate FAQs for this document.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
