'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  MessageSquare,
  Eye,
  Palette,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Save,
  Volume2,
  VolumeX,
  Monitor,
  Sun,
  Moon,
  Type,
  Zap,
  HelpCircle
} from 'lucide-react';
import {
  UserPreferencesService,
  type UserPreferences
} from '@/lib/user-preferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function SettingsPanel({ isOpen, onClose, className }: SettingsPanelProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(
    UserPreferencesService.loadPreferences()
  );
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const current = UserPreferencesService.loadPreferences();
      setPreferences(current);
      setHasChanges(false);
    }
  }, [isOpen]);

  const updatePreference = <T extends keyof UserPreferences>(
    section: T,
    key: keyof UserPreferences[T],
    value: UserPreferences[T][keyof UserPreferences[T]]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const savePreferences = () => {
    UserPreferencesService.savePreferences(preferences);
    setHasChanges(false);
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been saved successfully.',
    });
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      const defaults = UserPreferencesService.resetToDefaults();
      setPreferences(defaults);
      setHasChanges(false);
      toast({
        title: 'Settings Reset',
        description: 'All settings have been reset to defaults.',
      });
    }
  };

  const exportSettings = () => {
    const exported = UserPreferencesService.exportPreferences();
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legalmind-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Settings Exported',
      description: 'Your settings have been downloaded as a JSON file.',
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = UserPreferencesService.importPreferences(content);

      if (success) {
        const imported = UserPreferencesService.loadPreferences();
        setPreferences(imported);
        setHasChanges(false);
        toast({
          title: 'Settings Imported',
          description: 'Your settings have been imported successfully.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: 'Failed to import settings. Please check the file format.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l shadow-lg z-50',
              className
            )}
          >
            <Card className="h-full rounded-none border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Settings
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {hasChanges && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={savePreferences}
                        className="text-xs"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-4 pb-4">
                <Tabs defaultValue="chat" className="h-full">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="chat" className="text-xs">
                      <MessageSquare className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="accessibility" className="text-xs">
                      <Eye className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="ui" className="text-xs">
                      <Palette className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="text-xs">
                      <Shield className="h-3 w-3" />
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="h-[calc(100vh-180px)]">
                    {/* Chat Settings */}
                    <TabsContent value="chat" className="space-y-4 mt-0">
                      <div className="space-y-4">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Chat Settings
                        </h3>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm">Save Chat History</Label>
                              <p className="text-xs text-muted-foreground">
                                Store conversations for future reference
                              </p>
                            </div>
                            <Switch
                              checked={preferences.chatSettings.saveChatHistory}
                              onCheckedChange={(checked) =>
                                updatePreference('chatSettings', 'saveChatHistory', checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm">Auto-suggest Questions</Label>
                              <p className="text-xs text-muted-foreground">
                                Show relevant questions during chat
                              </p>
                            </div>
                            <Switch
                              checked={preferences.chatSettings.autoSuggestQuestions}
                              onCheckedChange={(checked) =>
                                updatePreference('chatSettings', 'autoSuggestQuestions', checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5 flex-1">
                              <Label className="text-sm flex items-center gap-2">
                                {preferences.chatSettings.voiceEnabled ? (
                                  <Volume2 className="h-3 w-3" />
                                ) : (
                                  <VolumeX className="h-3 w-3" />
                                )}
                                Voice Input
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Enable microphone for voice questions
                              </p>
                            </div>
                            <Switch
                              checked={preferences.chatSettings.voiceEnabled}
                              onCheckedChange={(checked) =>
                                updatePreference('chatSettings', 'voiceEnabled', checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Accessibility Settings */}
                    <TabsContent value="accessibility" className="space-y-4 mt-0">
                      <div className="space-y-4">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Accessibility
                        </h3>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-2">
                              <Type className="h-3 w-3" />
                              Font Size
                            </Label>
                            <Select
                              value={preferences.accessibility.fontSize}
                              onValueChange={(value: any) =>
                                updatePreference('accessibility', 'fontSize', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                                <SelectItem value="extra-large">Extra Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm">High Contrast</Label>
                              <p className="text-xs text-muted-foreground">
                                Increase contrast for better visibility
                              </p>
                            </div>
                            <Switch
                              checked={preferences.accessibility.highContrast}
                              onCheckedChange={(checked) =>
                                updatePreference('accessibility', 'highContrast', checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm">Reduced Motion</Label>
                              <p className="text-xs text-muted-foreground">
                                Minimize animations and transitions
                              </p>
                            </div>
                            <Switch
                              checked={preferences.accessibility.reducedMotion}
                              onCheckedChange={(checked) =>
                                updatePreference('accessibility', 'reducedMotion', checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm">Screen Reader Optimized</Label>
                              <p className="text-xs text-muted-foreground">
                                Enhanced accessibility for screen readers
                              </p>
                            </div>
                            <Switch
                              checked={preferences.accessibility.screenReaderOptimized}
                              onCheckedChange={(checked) =>
                                updatePreference('accessibility', 'screenReaderOptimized', checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* UI Settings */}
                    <TabsContent value="ui" className="space-y-4 mt-0">
                      <div className="space-y-4">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Interface
                        </h3>

                        <div className="space-y-4">
                          <div className="space-y-3">
                            <Label className="text-sm">Theme</Label>
                            <RadioGroup
                              value={preferences.ui.theme}
                              onValueChange={(value: any) =>
                                updatePreference('ui', 'theme', value)
                              }
                              className="grid grid-cols-3 gap-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="light" id="light" />
                                <Label htmlFor="light" className="text-xs flex items-center gap-1">
                                  <Sun className="h-3 w-3" />
                                  Light
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dark" id="dark" />
                                <Label htmlFor="dark" className="text-xs flex items-center gap-1">
                                  <Moon className="h-3 w-3" />
                                  Dark
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="system" id="system" />
                                <Label htmlFor="system" className="text-xs flex items-center gap-1">
                                  <Monitor className="h-3 w-3" />
                                  System
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm">Dock Position</Label>
                            <Select
                              value={preferences.ui.dockPosition}
                              onValueChange={(value: any) =>
                                updatePreference('ui', 'dockPosition', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="right">Right Side</SelectItem>
                                <SelectItem value="left">Left Side</SelectItem>
                                <SelectItem value="bottom">Bottom Center</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm flex items-center gap-2">
                                <Zap className="h-3 w-3" />
                                Show Animations
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Enable interface animations and transitions
                              </p>
                            </div>
                            <Switch
                              checked={preferences.ui.showAnimations}
                              onCheckedChange={(checked) =>
                                updatePreference('ui', 'showAnimations', checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm">Compact Mode</Label>
                              <p className="text-xs text-muted-foreground">
                                Reduce spacing for smaller screens
                              </p>
                            </div>
                            <Switch
                              checked={preferences.ui.compactMode}
                              onCheckedChange={(checked) =>
                                updatePreference('ui', 'compactMode', checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Privacy Settings */}
                    <TabsContent value="privacy" className="space-y-4 mt-0">
                      <div className="space-y-4">
                        <h3 className="font-medium text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Privacy & Data
                        </h3>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Document Retention</Label>
                            <Select
                              value={preferences.privacy.documentRetention}
                              onValueChange={(value: any) =>
                                updatePreference('privacy', 'documentRetention', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="never">Never Save</SelectItem>
                                <SelectItem value="7days">7 Days</SelectItem>
                                <SelectItem value="30days">30 Days</SelectItem>
                                <SelectItem value="90days">90 Days</SelectItem>
                                <SelectItem value="forever">Forever</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm">Error Reporting</Label>
                              <p className="text-xs text-muted-foreground">
                                Help improve the app by sharing error reports
                              </p>
                            </div>
                            <Switch
                              checked={preferences.privacy.errorReportingOptIn}
                              onCheckedChange={(checked) =>
                                updatePreference('privacy', 'errorReportingOptIn', checked)
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm">Usage Analytics</Label>
                              <p className="text-xs text-muted-foreground">
                                Anonymous usage data to improve features
                              </p>
                            </div>
                            <Switch
                              checked={preferences.privacy.analyticsOptIn}
                              onCheckedChange={(checked) =>
                                updatePreference('privacy', 'analyticsOptIn', checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </ScrollArea>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportSettings}
                        className="flex-1 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                      <div>
                        <input
                          type="file"
                          accept=".json"
                          onChange={importSettings}
                          className="hidden"
                          id="import-settings"
                        />
                        <Label htmlFor="import-settings">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs cursor-pointer"
                            asChild
                          >
                            <span>
                              <Upload className="h-3 w-3 mr-1" />
                              Import
                            </span>
                          </Button>
                        </Label>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetToDefaults}
                      className="w-full text-xs text-destructive hover:text-destructive"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset to Defaults
                    </Button>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}