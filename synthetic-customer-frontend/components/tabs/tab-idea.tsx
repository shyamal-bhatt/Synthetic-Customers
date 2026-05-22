"use client";

import { useEffect, useState } from "react";
import { Clock, DollarSign, Users, Globe } from "lucide-react";
import type { StudyConfig, MCQAnswers, StudyMCQSchema } from "@/app/page";

interface TabIdeaProps {
  config: StudyConfig;
  mcqForm: StudyMCQSchema;
  mcqAnswers: MCQAnswers;
}

export function TabIdea({ config, mcqForm, mcqAnswers }: TabIdeaProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);

  // Helper to dynamically resolve chosen option label for a given research dimension
  const getSelectedLabel = (dimension: string) => {
    const question = mcqForm.questions.find((q) => q.dimension === dimension);
    if (!question) return "TBD";
    const selectedOptionId = mcqAnswers[question.id];
    const option = question.options.find((opt) => opt.id === selectedOptionId);
    return option ? option.label : "TBD";
  };

  const pricingTolerance = getSelectedLabel("pricing_tolerance");
  const problemUrgency = getSelectedLabel("problem_urgency");
  const currentBehaviour = getSelectedLabel("current_behaviour");
  const purchaseTrigger = getSelectedLabel("purchase_trigger");
  const biggestHesitation = getSelectedLabel("biggest_hesitation");

  const fullText = `Based on your product concept, we've identified a compelling opportunity in the ${config.targetAudience.toLowerCase()} segment. 

Your product addresses a genuine pain point: ${config.productIdea.slice(0, 100)}${config.productIdea.length > 100 ? "..." : ""}

Key Market Mechanics (from your context input):
• Pricing Tolerance: ${pricingTolerance}
• Problem Urgency: ${problemUrgency}
• Current Behaviour: ${currentBehaviour}
• Purchase Trigger: ${purchaseTrigger}
• Biggest Hesitation: ${biggestHesitation}

The synthetic cohort has been calibrated to match your target demographic profile, enabling high-fidelity behavioral simulation across purchase intent, feature prioritization, and objection patterns.`;

  useEffect(() => {
    let index = 0;
    const streamInterval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
      } else {
        setIsStreaming(false);
        clearInterval(streamInterval);
      }
    }, 12);

    return () => clearInterval(streamInterval);
  }, [fullText]);

  const stats = [
    {
      icon: Clock,
      label: "Time",
      value: "5 mins",
      color: "text-blue-600",
    },
    {
      icon: DollarSign,
      label: "Cost",
      value: "$2",
      color: "text-emerald-600",
    },
    {
      icon: Users,
      label: "Sample Size",
      value: `${config.cohortSize} personas`,
      color: "text-amber-600",
    },
    {
      icon: Globe,
      label: "Region",
      value: "Global",
      color: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border rounded-xl p-8">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Product Analysis Summary
        </h3>
        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
            {displayedText}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-foreground/70 ml-0.5 animate-pulse" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
