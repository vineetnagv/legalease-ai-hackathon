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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Moon, Sun, Laptop } from "lucide-react"

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
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="theme-group">Theme</Label>
              </div>
              <RadioGroup
                id="theme-group"
                defaultValue={theme}
                onValueChange={(newTheme) => setTheme(newTheme)}
                className="grid max-w-md grid-cols-3 gap-8 pt-2"
              >
                <div>
                  <RadioGroupItem
                    value="light"
                    id="light"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Sun className="mb-3 h-6 w-6" />
                    Light
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="dark"
                    id="dark"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Moon className="mb-3 h-6 w-6" />
                    Dark
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="system"
                    id="system"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Laptop className="mb-3 h-6 w-6" />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
        
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
              <Switch id="high-contrast" disabled />
            </div>
             <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="font-size" className="flex flex-col space-y-1">
                <span>Font Size</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Adjust the font size for better readability.
                </span>
              </Label>
              <Button variant="outline" disabled>Default</Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
