import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/language-context';
import { useTranslation } from '@/lib/translations';

interface RiskMeterProps {
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: string;
}

export default function RiskMeter({
  riskScore,
  riskLevel,
  summary,
}: RiskMeterProps) {
  const { language } = useLanguage();
  const t = useTranslation(language);

  const riskColorClass = {
    Low: 'text-risk-low',
    Medium: 'text-risk-medium',
    High: 'text-risk-high',
  };

  const riskBgClass = {
    Low: 'bg-risk-low',
    Medium: 'bg-risk-medium',
    High: 'bg-risk-high',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t('risk_meter')}</CardTitle>
        <CardDescription>
          {t('risk_assessment_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-bold ${riskColorClass[riskLevel]}`}
            >
              {riskLevel}
            </span>

            <span className="text-xl font-medium text-muted-foreground">
              ({riskScore}/100)
            </span>
          </div>
          <div className="w-full flex-1">
            <Progress
              value={riskScore}
              className={`h-3 [&>div]:${riskBgClass[riskLevel]}`}
            />
          </div>
        </div>
        <div>
          <h4 className="font-semibold">{t('summary_of_findings')}</h4>
          <p className="text-muted-foreground">{summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}
