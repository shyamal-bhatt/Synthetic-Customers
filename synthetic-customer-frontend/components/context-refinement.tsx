"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import type { StudyConfig, MCQAnswers } from "@/app/page";

interface ContextRefinementProps {
  config: StudyConfig;
  onGenerateCohort: (answers: MCQAnswers) => void;
}

const questions = [
  {
    id: "monetization",
    question: "What is your primary monetization model?",
    options: [
      { value: "subscription", label: "Monthly Subscription" },
      { value: "pay-per-use", label: "Pay-per-use" },
      { value: "freemium", label: "Free-tier with enterprise upgrades" },
      { value: "one-time", label: "One-time purchase" },
    ],
  },
  {
    id: "timeline",
    question: "What is your expected launch timeline?",
    options: [
      { value: "1-month", label: "Within 1 month" },
      { value: "3-months", label: "1-3 months" },
      { value: "6-months", label: "3-6 months" },
      { value: "exploring", label: "Still exploring" },
    ],
  },
  {
    id: "competition",
    question: "How would you describe your competitive landscape?",
    options: [
      { value: "blue-ocean", label: "No direct competitors (Blue Ocean)" },
      { value: "few-competitors", label: "Few established competitors" },
      { value: "crowded", label: "Crowded market with differentiation" },
      { value: "disrupting", label: "Disrupting existing solutions" },
    ],
  },
];

export function ContextRefinement({
  config,
  onGenerateCohort,
}: ContextRefinementProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<MCQAnswers>({
    monetization: "",
    timeline: "",
    competition: "",
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const progress = ((currentStep + 1) / questions.length) * 100;
  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id as keyof MCQAnswers];

  const handleSelectOption = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleGenerate = () => {
    onGenerateCohort(answers);
  };

  const isLastStep = currentStep === questions.length - 1;
  const canProceed = currentAnswer !== "";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-xl">
        {/* Card Container */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm">
          {/* Progress Header */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                Refining Product Context
              </span>
              <span className="text-sm font-medium text-foreground">
                Step {currentStep + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Question Content */}
          <div
            className={`transition-all duration-200 ${
              isTransitioning
                ? "opacity-0 translate-x-4"
                : "opacity-100 translate-x-0"
            }`}
          >
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-balance">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                    currentAnswer === option.value
                      ? "border-foreground bg-foreground/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 transition-colors ${
                      currentAnswer === option.value
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {currentAnswer === option.value ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-10">
            {isLastStep ? (
              <Button
                onClick={handleGenerate}
                disabled={!canProceed}
                className="w-full h-14 text-base font-medium rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Synthetic Cohort
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="w-full h-14 text-base font-medium rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Continue
              </Button>
            )}
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-6 bg-foreground"
                    : index < currentStep
                    ? "bg-foreground"
                    : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
