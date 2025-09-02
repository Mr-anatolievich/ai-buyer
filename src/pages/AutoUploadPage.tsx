import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stepper } from '@/components/auto-upload/Stepper';
import { CampaignStep } from '@/components/auto-upload/CampaignStep';
import { AdSetStep } from '@/components/auto-upload/AdSetStep';
import { AdStep } from '@/components/auto-upload/AdStep';
import { PreviewPanel } from '@/components/auto-upload/PreviewPanel';
import { WizardControls } from '@/components/auto-upload/WizardControls';
import { TemplatesTab } from '@/components/auto-upload/TemplatesTab';
import { useAppStore } from '@/store/useAppStore';
import { useTranslations } from '@/lib/translations';

export default function AutoUploadPage() {
  const { currentStep } = useAppStore();
  const [activeTab, setActiveTab] = useState('wizard');
  const t = useTranslations();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <CampaignStep />;
      case 2:
        return <AdSetStep />;
      case 3:
        return <AdStep />;
      default:
        return <CampaignStep />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t.autoupload}</h1>
        <p className="text-muted-foreground mt-1">
          Створіть свою рекламну кампанію крок за кроком
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="wizard">Майстер кампанії</TabsTrigger>
          <TabsTrigger value="templates">{t.templates}</TabsTrigger>
        </TabsList>

        <TabsContent value="wizard" className="space-y-6">
          {/* Step Progress */}
          <Stepper />

          {/* Main Wizard Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Current Step */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Крок {currentStep}: {
                      currentStep === 1 ? 'Налаштування кампанії' : 
                      currentStep === 2 ? 'Аудиторія та таргетування' : 
                      'Креатив та призначення'
                    }
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1 && 'Налаштуйте мету кампанії та бюджет'}
                    {currentStep === 2 && 'Визначте цільову аудиторію та розміщення'}
                    {currentStep === 3 && 'Завантажте креативи та встановіть призначення'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderCurrentStep()}
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Preview */}
            <div>
              <PreviewPanel />
            </div>
          </div>

          {/* Bottom Controls */}
          <WizardControls />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}