import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

const STEPS = [
  { id: 1, title: 'Campaign', description: 'Objective & Budget' },
  { id: 2, title: 'Ad Set', description: 'Audience & Targeting' },
  { id: 3, title: 'Ad', description: 'Creative & Destination' },
];

export function Stepper() {
  const { currentStep, validateStep } = useAppStore();

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const isStepValid = (stepId: number) => {
    if (stepId >= currentStep) return true;
    return validateStep(stepId);
  };

  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, index) => {
        const status = getStepStatus(step.id);
        const isValid = isStepValid(step.id);
        
        return (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  status === 'completed' && isValid
                    ? 'bg-primary border-primary text-primary-foreground'
                    : status === 'completed' && !isValid
                    ? 'bg-destructive border-destructive text-destructive-foreground'
                    : status === 'current'
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground text-muted-foreground'
                )}
              >
                {status === 'completed' ? (
                  isValid ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-medium">!</span>
                  )
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
            </div>

            {/* Step Content */}
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    'text-sm font-medium',
                    status === 'current'
                      ? 'text-primary'
                      : status === 'completed'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </h3>
                {status === 'completed' && !isValid && (
                  <span className="text-xs text-destructive">(Incomplete)</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {step.description}
              </p>
            </div>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px bg-border flex-1 mx-4',
                  status === 'completed' && 'bg-primary'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}