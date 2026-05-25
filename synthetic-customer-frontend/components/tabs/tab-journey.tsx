"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const journeySteps = [
  {
    id: 1,
    title: "Analyzing Context",
    description: "Capturing product idea and target audience parameters",
  },
  {
    id: 2,
    title: "Cohort Architecture",
    description: "Designing demographic and psychographic distributions",
  },
  {
    id: 3,
    title: "Simulating Profiles",
    description: "Generating synthetic customer profiles",
  },
];

interface TabJourneyProps {
  activeStep?: number;
  completedSteps?: number[];
}

export function TabJourney({ activeStep: externalActiveStep, completedSteps: externalCompletedSteps }: TabJourneyProps = {}) {
  const [localCompletedSteps, setLocalCompletedSteps] = useState<number[]>([]);
  const [localActiveStep, setLocalActiveStep] = useState(1);

  const completedSteps = externalCompletedSteps ?? localCompletedSteps;
  const activeStep = externalActiveStep ?? localActiveStep;

  useEffect(() => {
    // Only run local simulation if no external controls are provided
    if (externalActiveStep !== undefined || externalCompletedSteps !== undefined) {
      return;
    }

    const completeStep = (stepId: number) => {
      setLocalCompletedSteps((prev) => [...prev, stepId]);
      if (stepId < journeySteps.length) {
        setLocalActiveStep(stepId + 1);
      }
    };

    // Simulate step completion with delays
    const timers = journeySteps.map((step, index) => {
      return setTimeout(() => {
        completeStep(step.id);
      }, (index + 1) * 800);
    });

    return () => timers.forEach(clearTimeout);
  }, [externalActiveStep, externalCompletedSteps]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-8 md:p-10 shadow-2xl">
        <h3 className="text-xl font-semibold text-foreground mb-8">
          Study Generation Timeline
        </h3>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

          {/* Steps */}
          <div className="space-y-6">
            {journeySteps.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isActive = activeStep === step.id && !isCompleted;

              return (
                <div
                  key={step.id}
                  className={`relative flex items-start gap-6 transition-all duration-500 ${
                    isCompleted || isActive
                      ? "opacity-100"
                      : "opacity-40"
                  }`}
                >
                  {/* Step Badge */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-foreground border-foreground"
                        : isActive
                        ? "bg-background border-foreground"
                        : "bg-background border-border"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-background" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-foreground animate-spin" />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        {step.id}
                      </span>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pt-2 pb-6">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-foreground">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
