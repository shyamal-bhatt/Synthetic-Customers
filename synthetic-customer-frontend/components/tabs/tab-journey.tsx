"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const journeySteps = [
  {
    id: 1,
    title: "Pasting Idea",
    description: "Capturing your product concept and target audience",
    duration: "Completed",
  },
  {
    id: 2,
    title: "Schema Parsing",
    description: "Extracting features, value propositions, and market signals",
    duration: "2.3 seconds",
  },
  {
    id: 3,
    title: "Cohort Architecture",
    description: "Designing demographic and psychographic distributions",
    duration: "1.8 seconds",
  },
  {
    id: 4,
    title: "Persona Execution",
    description: "Generating synthetic customer profiles with behavioral models",
    duration: "4.2 seconds",
  },
  {
    id: 5,
    title: "Cluster Synthesis",
    description: "Aggregating insights and identifying behavioral patterns",
    duration: "1.5 seconds",
  },
];

export function TabJourney() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const completeStep = (stepId: number) => {
      setCompletedSteps((prev) => [...prev, stepId]);
      if (stepId < journeySteps.length) {
        setActiveStep(stepId + 1);
      }
    };

    // Simulate step completion with delays
    const timers = journeySteps.map((step, index) => {
      return setTimeout(() => {
        completeStep(step.id);
      }, (index + 1) * 800);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-8 md:p-10">
        <h3 className="text-xl font-semibold text-foreground mb-8">
          Study Generation Timeline
        </h3>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

          {/* Steps */}
          <div className="space-y-6">
            {journeySteps.map((step, index) => {
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
                      <span className="text-xs text-muted-foreground">
                        {step.duration}
                      </span>
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
