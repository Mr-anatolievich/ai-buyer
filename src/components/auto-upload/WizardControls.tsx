import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from '@/lib/translations';

export function WizardControls() {
  const { 
    currentStep, 
    setCurrentStep, 
    validateStep, 
    resetDraft,
    draft 
  } = useAppStore();
  const { toast } = useToast();
  const t = useTranslations();

  const progress = (currentStep / 3) * 100;
  const canGoNext = validateStep(currentStep);
  const canGoBack = currentStep > 1;
  const isLastStep = currentStep === 3;

  const handleNext = () => {
    if (canGoNext && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      toast({
        title: "Step completed",
        description: `Step ${currentStep} completed successfully.`,
      });
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    // Validate all steps
    const allStepsValid = [1, 2, 3].every(step => validateStep(step));
    
    if (allStepsValid) {
      toast({
        title: "Campaign saved!",
        description: "Your campaign has been saved as a draft and is ready for review.",
      });
      console.log('Saving campaign:', draft);
    } else {
      toast({
        variant: "destructive",
        title: "Cannot save campaign",
        description: "Please complete all required fields in all steps.",
      });
    }
  };

  const handleReset = () => {
    resetDraft();
    toast({
      title: "Draft reset",
      description: "All fields have been cleared. You can start over.",
    });
  };

  const getValidationMessage = () => {
    if (currentStep === 1 && !draft.campaign.name.trim()) {
      return "Please enter a campaign name";
    }
    if (currentStep === 1 && draft.campaign.budgetType === 'daily' && draft.campaign.dailyBudget <= 0) {
      return "Please enter a valid daily budget";
    }
    if (currentStep === 2 && !draft.adSet.name.trim()) {
      return "Please enter an ad set name";
    }
    if (currentStep === 2 && !draft.adSet.target.location.trim()) {
      return "Please select a target location";
    }
    if (currentStep === 2 && (draft.adSet.target.ageRange[0] < 18 || draft.adSet.target.ageRange[1] > 65)) {
      return "Age range must be between 18-65 years";
    }
    if (currentStep === 3 && !draft.ad.creative.primaryText.trim()) {
      return "Please enter primary text for your ad";
    }
    if (currentStep === 3 && !draft.ad.creative.headline.trim()) {
      return "Please enter a headline for your ad";
    }
    if (currentStep === 3 && !draft.ad.destination.websiteUrl.trim()) {
      return "Please enter a website URL";
    }
    if (currentStep === 3) {
      try {
        new URL(draft.ad.destination.websiteUrl);
      } catch {
        return "Please enter a valid website URL";
      }
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Validation Alert */}
          {validationMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationMessage}</AlertDescription>
            </Alert>
          )}

          {/* All Steps Complete */}
          {currentStep === 3 && canGoNext && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Great! All steps are complete. You can now save your campaign or review the preview.
              </AlertDescription>
            </Alert>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={!canGoBack}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              {!isLastStep ? (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={!canGoNext}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Campaign
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleSave}
                disabled={currentStep === 1 && !draft.campaign.name.trim()}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
              
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 pt-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step === currentStep
                    ? 'bg-primary'
                    : step < currentStep
                    ? 'bg-primary/60'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}