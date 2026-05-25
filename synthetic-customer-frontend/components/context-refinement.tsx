import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Sparkles, Pencil, Check, X } from "lucide-react";
import type { StudyConfig, MCQAnswers, StudyMCQSchema } from "@/app/page";

interface ContextRefinementProps {
  config: StudyConfig;
  mcqForm: StudyMCQSchema;
  onGenerateCohort: (answers: MCQAnswers, updatedForm: StudyMCQSchema) => void;
}

export function ContextRefinement({
  config,
  mcqForm,
  onGenerateCohort,
}: ContextRefinementProps) {
  const [localMcqForm, setLocalMcqForm] = useState<StudyMCQSchema>(() => {
    // Clone form and insert 'other' option at the end of each question if not already there
    const cloned = JSON.parse(JSON.stringify(mcqForm)) as StudyMCQSchema;
    cloned.questions.forEach((q) => {
      if (!q.options.some((opt) => opt.id === "other")) {
        q.options.push({ id: "other", label: "" });
      }
    });
    return cloned;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<MCQAnswers>(() => {
    const initial: MCQAnswers = {};
    mcqForm.questions.forEach((q) => {
      initial[q.id] = "";
    });
    return initial;
  });
  
  const [editingOption, setEditingOption] = useState<{ questionId: string; optionId: string } | null>(null);
  const [editText, setEditText] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const questions = localMcqForm.questions;
  const progress = ((currentStep + 1) / questions.length) * 100;
  const currentQuestion = questions[currentStep];
  const currentAnswer = answers[currentQuestion.id];

  const handleSelectOption = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));

    // Frictionless trigger: immediately open text editor if other is clicked and currently empty
    if (value === "other") {
      const q = localMcqForm.questions.find((quest) => quest.id === currentQuestion.id);
      const otherOpt = q?.options.find((opt) => opt.id === "other");
      setEditingOption({ questionId: currentQuestion.id, optionId: "other" });
      setEditText(otherOpt?.label || "");
    }
  };

  const handleSaveEdit = (questionId: string, optionId: string) => {
    const trimmed = editText.trim();
    if (!trimmed && optionId !== "other") {
      setEditingOption(null);
      return;
    }

    setLocalMcqForm((prev) => {
      const updatedQuestions = prev.questions.map((q) => {
        if (q.id !== questionId) return q;
        const updatedOptions = q.options.map((opt) => 
          opt.id === optionId ? { ...opt, label: trimmed } : opt
        );
        return { ...q, options: updatedOptions };
      });
      return { ...prev, questions: updatedQuestions };
    });

    if (optionId === "other") {
      if (trimmed) {
        setAnswers((prev) => ({ ...prev, [questionId]: "other" }));
      } else {
        setAnswers((prev) => ({ ...prev, [questionId]: "" }));
      }
    }

    setEditingOption(null);
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
    // Return final selection mapping alongside the fully updated MCQ form
    const cleanedForm = {
      ...localMcqForm,
      questions: localMcqForm.questions.map((q) => ({
        ...q,
        options: q.options.filter((opt) => opt.label.trim() !== ""),
      })),
    };
    onGenerateCohort(answers, cleanedForm);
  };

  const isLastStep = currentStep === questions.length - 1;
  
  // A question is answered if a selection is made and, if it is 'other', it has non-empty text
  const currentOtherOption = currentQuestion.options.find((o) => o.id === "other");
  const canProceed = currentAnswer !== "" && (currentAnswer !== "other" || (currentOtherOption && currentOtherOption.label.trim() !== ""));

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background animate-in fade-in duration-300">
      <div className="w-full max-w-xl">
        {/* Card Container */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-md relative overflow-hidden">
          {/* Progress Header */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
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
              {currentQuestion.options.map((option) => {
                const isOther = option.id === "other";
                const isEditing = editingOption?.questionId === currentQuestion.id && editingOption?.optionId === option.id;
                
                let displayLabel = option.label;
                if (isOther && !option.label) {
                  displayLabel = "Other (Write your own thought)";
                }

                return (
                  <div
                    key={option.id}
                    className={`relative w-full rounded-xl border transition-all duration-200 ${
                      currentAnswer === option.id
                        ? "border-foreground bg-foreground/5 text-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 p-3 w-full bg-background animate-in fade-in duration-150">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit(currentQuestion.id, option.id);
                            } else if (e.key === "Escape") {
                              setEditingOption(null);
                            }
                          }}
                          placeholder={isOther ? "Write your own thought..." : "Edit option..."}
                          className="flex-1 bg-transparent text-sm text-foreground focus:outline-none border-b border-foreground/20 py-1 px-2 font-medium"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(currentQuestion.id, option.id)}
                          className="p-1.5 rounded-lg hover:bg-muted text-emerald-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingOption(null)}
                          className="p-1.5 rounded-lg hover:bg-muted text-rose-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full p-4 group/item">
                        <button
                          onClick={() => handleSelectOption(option.id)}
                          className="flex-1 flex items-center gap-4 text-left focus:outline-none"
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
                          <span className="font-semibold text-sm leading-relaxed pr-8">
                            {displayLabel}
                          </span>
                        </button>

                        {/* Custom Edit Option Trigger */}
                        <div className="relative flex items-center shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingOption({ questionId: currentQuestion.id, optionId: option.id });
                              setEditText(option.label || (isOther ? "" : displayLabel));
                            }}
                            className="p-1.5 rounded-lg border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity duration-200 group/btn relative"
                            title="Edit option"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            
                            {/* Hover Tooltip */}
                            <span className="pointer-events-none absolute bottom-full right-0 mb-2 w-48 scale-90 rounded bg-foreground text-[10px] font-bold text-background p-2 text-center opacity-0 group-hover/btn:opacity-100 group-hover/btn:scale-100 transition-all duration-200 z-20 shadow-md">
                              Anything else that shapes this? (optional)
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
                Analyze
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

          {/* Interactive Breadcrumb Indicators */}
          <div className="flex items-center justify-center gap-2.5 mt-8">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentStep(index);
                    setIsTransitioning(false);
                  }, 200);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none hover:scale-125 ${
                  index === currentStep
                    ? "w-7 bg-foreground cursor-default"
                    : index < currentStep
                    ? "bg-foreground/80 cursor-pointer"
                    : "bg-border cursor-pointer hover:bg-muted-foreground/30"
                }`}
                title={`Go back to question ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
