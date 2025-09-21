"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useFont } from "@/contexts/font-size-context"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLanguage } from "@/contexts/language-context"
import { useTranslation } from "@/lib/translations"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { fontSize, setFontSize } = useFont()
  const { language } = useLanguage();
  const t = useTranslation(language);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
        <p className="text-muted-foreground">
          {t('manage_settings')}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('accessibility')}</CardTitle>
            <CardDescription>
              {t('accessibility_settings')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
             <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="high-contrast" className="flex flex-col space-y-1">
                <span>{t('high_contrast_mode')}</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  {t('high_contrast_description')}
                </span>
              </Label>
              <Switch id="high-contrast" />
            </div>
             <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="font-size" className="flex flex-col space-y-1">
                <span>{t('font_size')}</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  {t('font_size_description')}
                </span>
              </Label>
              <RadioGroup
                value={fontSize}
                onValueChange={setFontSize}
                className="flex items-center gap-4"
              >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text-sm" id="font-sm" />
                    <Label htmlFor="font-sm" className="cursor-pointer">{t('font_small')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text-base" id="font-default" />
                    <Label htmlFor="font-default" className="cursor-pointer">{t('font_default')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text-lg" id="font-lg" />
                    <Label htmlFor="font-lg" className="cursor-pointer">{t('font_large')}</Label>
                  </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
