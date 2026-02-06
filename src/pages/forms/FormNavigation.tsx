import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const FormNavigation = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
}: FormNavigationProps) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex justify-between mt-8 pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={currentStep === 0}
        className="gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>

      {isLastStep ? (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="gap-2 bg-gold hover:bg-gold/90 text-gold-foreground"
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
          <Send className="w-4 h-4" />
        </Button>
      ) : (
        <Button type="button" onClick={onNext} className="gap-2 bg-navy hover:bg-navy/90">
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default FormNavigation;
