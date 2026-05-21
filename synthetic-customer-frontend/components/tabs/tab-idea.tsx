"use client";

import { useEffect, useState } from "react";
import { Clock, DollarSign, Users, Globe } from "lucide-react";
import type { StudyConfig, MCQAnswers } from "@/app/page";

interface TabIdeaProps {
  config: StudyConfig;
  mcqAnswers: MCQAnswers;
}

const monetizationLabels: Record<string, string> = {
  subscription: "Monthly Subscription",
  "pay-per-use": "Pay-per-use",
  freemium: "Freemium Model",
  "one-time": "One-time Purchase",
};

const timelineLabels: Record<string, string> = {
  "1-month": "< 1 Month",
  "3-months": "1-3 Months",
  "6-months": "3-6 Months",
  exploring: "Exploring",
};

const competitionLabels: Record<string, string> = {
  "blue-ocean": "Blue Ocean",
  "few-competitors": "Few Competitors",
  crowded: "Crowded Market",
  disrupting: "Disrupting Existing",
};

export function TabIdea({ config, mcqAnswers }: TabIdeaProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);

  const fullText = `Based on your product concept, we've identified a compelling opportunity in the ${config.targetAudience.toLowerCase()} segment. 

Your product addresses a genuine pain point: ${config.productIdea.slice(0, 100)}${config.productIdea.length > 100 ? "..." : ""}

Key Market Mechanics:
• Primary revenue model: ${monetizationLabels[mcqAnswers.monetization] || "TBD"}
• Go-to-market timeline: ${timelineLabels[mcqAnswers.timeline] || "TBD"}
• Competitive positioning: ${competitionLabels[mcqAnswers.competition] || "TBD"}

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
