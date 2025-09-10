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

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application settings.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Accessibility</CardTitle>
            <CardDescription>
              Settings to improve your experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
             <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="high-contrast" className="flex flex-col space-y-1">
                <span>High Contrast Mode</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Improve visibility and text readability.
                </span>
              </Label>
              <Switch id="high-contrast" />
            </div>
             <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="font-size" className="flex flex-col space-y-1">
                <span>Font Size</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Adjust the font size for better readability.
                </span>
              </Label>
              <Button variant="outline">Default</Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
