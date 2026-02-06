import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const FormProgress = ({ currentStep, totalSteps, stepLabels }: FormProgressProps) => {
  const progressPercentage = ((currentStep) / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground">{stepLabels[currentStep]}</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      
      {/* Step Indicators */}
      <div className="flex justify-between mt-4">
        {stepLabels.map((label, index) => (
          <div key={label} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index < currentStep
                  ? "bg-gold text-gold-foreground"
                  : index === currentStep
                  ? "bg-navy text-navy-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <span className="text-xs text-muted-foreground mt-1 text-center hidden sm:block">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormProgress;
