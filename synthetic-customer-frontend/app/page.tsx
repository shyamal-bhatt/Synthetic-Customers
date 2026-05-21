"use client";

import { useState, useEffect, useCallback } from "react";
import { LandingPage } from "@/components/landing-page";
import { ContextRefinement } from "@/components/context-refinement";
import { Dashboard } from "@/components/dashboard";

export type AppState = "landing" | "refinement" | "dashboard";

export interface StudyConfig {
  productIdea: string;
  targetAudience: string;
  cohortSize: number;
}

export interface MCQAnswers {
  monetization: string;
  timeline: string;
  competition: string;
}

export default function SyntheticCustomer() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [studyConfig, setStudyConfig] = useState<StudyConfig>({
    productIdea: "",
    targetAudience: "",
    cohortSize: 20,
  });
  const [mcqAnswers, setMcqAnswers] = useState<MCQAnswers>({
    monetization: "",
    timeline: "",
    competition: "",
  });

  const handleInitializeStudy = useCallback((config: StudyConfig) => {
    setStudyConfig(config);
    setAppState("refinement");
  }, []);

  const handleGenerateCohort = useCallback((answers: MCQAnswers) => {
    setMcqAnswers(answers);
    setAppState("dashboard");
  }, []);

  const handleReset = useCallback(() => {
    setAppState("landing");
    setStudyConfig({ productIdea: "", targetAudience: "", cohortSize: 20 });
    setMcqAnswers({ monetization: "", timeline: "", competition: "" });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {appState === "landing" && (
        <LandingPage onInitialize={handleInitializeStudy} />
      )}
      {appState === "refinement" && (
        <ContextRefinement
          config={studyConfig}
          onGenerateCohort={handleGenerateCohort}
        />
      )}
      {appState === "dashboard" && (
        <Dashboard
          config={studyConfig}
          mcqAnswers={mcqAnswers}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
