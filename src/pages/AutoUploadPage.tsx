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

export default function AutoUploadPage() {
  const { currentStep } = useAppStore();
  const [activeTab, setActiveTab] = useState('wizard');

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
        <h1 className="text-3xl font-bold">Autoupload</h1>
        <p className="text-muted-foreground mt-1">
          Create your advertising campaign step by step
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="wizard">Campaign Wizard</TabsTrigger>
          <TabsTrigger value="templates">Comments/Templates</TabsTrigger>
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
                    Step {currentStep}: {
                      currentStep === 1 ? 'Campaign Setup' : 
                      currentStep === 2 ? 'Audience & Targeting' : 
                      'Creative & Destination'
                    }
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1 && 'Configure your campaign objective and budget'}
                    {currentStep === 2 && 'Define your target audience and placements'}
                    {currentStep === 3 && 'Upload creative assets and set destination'}
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