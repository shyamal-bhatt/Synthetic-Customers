"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import type { StudyConfig, MCQAnswers, StudyMCQSchema } from "@/app/page";

interface ContextRefinementProps {
  config: StudyConfig;
  mcqForm: StudyMCQSchema;
  onGenerateCohort: (answers: MCQAnswers) => void;
}

export function ContextRefinement({
  config,
  mcqForm,
  onGenerateCohort,
}: ContextRefinementProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<MCQAnswers>(() => {
    const initial: MCQAnswers = {};
    mcqForm.questions.forEach((q) => {
      initial[q.id] = "";
    });
    return initial;
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const questions = mcqForm.questions;
  const progress = ((currentStep + 1) / questions.length) * 100;
  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id];

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
              <span className="text-sm text-muted-foreground font-medium">
                Refining Product Context
              </span>
              <span className="text-sm font-semibold text-foreground">
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
            <span className="text-xs uppercase tracking-wider font-semibold text-foreground bg-foreground/5 px-2.5 py-1 rounded-full border border-border">
              {currentQuestion.dimension.replace("_", " ")}
            </span>
            <h2 className="text-2xl font-semibold text-foreground mt-4 mb-8 text-balance leading-snug">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                    currentAnswer === option.id
                      ? "border-foreground bg-foreground/5 text-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 transition-colors ${
                      currentAnswer === option.id
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {currentAnswer === option.id ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <span className="font-semibold text-sm">{option.label}</span>
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
