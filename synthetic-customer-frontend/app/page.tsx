"use client";

import { useState, useEffect, useCallback } from "react";
import { LandingPage } from "@/components/landing-page";
import { ContextRefinement } from "@/components/context-refinement";
import { Dashboard } from "@/components/dashboard";
import { Toaster, toast } from "sonner";

export type AppState = "landing" | "refinement" | "dashboard";

export interface StudyConfig {
  productIdea: string;
  targetAudience: string;
  cohortSize: number;
}

export interface MCQOption {
  id: string;
  label: string;
}

export interface MCQQuestion {
  id: string;
  dimension: string;
  question: string;
  options: MCQOption[];
}

export interface StudyMCQSchema {
  questions: MCQQuestion[];
}

export type MCQAnswers = Record<string, string>;

export default function SyntheticCustomer() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [isInitializing, setIsInitializing] = useState(false);
  const [studyConfig, setStudyConfig] = useState<StudyConfig>({
    productIdea: "",
    targetAudience: "",
    cohortSize: 20,
  });
  const [mcqForm, setMcqForm] = useState<StudyMCQSchema | null>(null);
  const [mcqAnswers, setMcqAnswers] = useState<MCQAnswers>({});

  const handleInitializeStudy = useCallback(async (config: StudyConfig) => {
    setIsInitializing(true);
    
    // 1. Initial Step: Log initiating action
    console.log("==================================================");
    console.log("🚀 [FRONTEND] Step 1: Initiating Study Initialization...");
    console.log("👉 Parameters to submit:", config);
    console.log("==================================================");
    
    toast.loading("Initializing Study Framework on backend...", { id: "init-study" });

    try {
      // 2. Step 2: HTTP request details
      const apiUrl = "http://localhost:8000/api/v1/study/initialize";
      console.log(`📡 [FRONTEND] Step 2: Sending HTTP POST request to API -> ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      // 3. Step 3: Parse response header status
      console.log(`📡 [FRONTEND] Step 3: Server responded with HTTP status ${response.status} (${response.statusText})`);

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Server returned error status ${response.status}: ${errorDetail}`);
      }

      // 4. Step 4: Parse response body
      const data = await response.json();
      console.log("✅ [FRONTEND] Step 4: Study initialized successfully on the backend!");
      console.log("📦 [FRONTEND] Received study payload:", data);
      console.log(`🔑 [FRONTEND] Generated Study ID (UUID): ${data.study_id}`);
      console.log("==================================================");

      toast.success("Study Framework initialized successfully!", {
        id: "init-study",
        description: `Study ID: ${data.study_id.substring(0, 8)}...`,
      });

      setStudyConfig(config);
      setMcqForm(data.mcqForm);
      setAppState("refinement");
    } catch (err: any) {
      // Step 5: Log error details
      console.error("❌ [FRONTEND] Step 5: Study Initialization failed!");
      console.error("👉 Error details:", err);
      console.log("==================================================");

      toast.error("Failed to initialize study framework.", {
        id: "init-study",
        description: err?.message || "Verify the FastAPI server is running on port 8000.",
      });
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const handleGenerateCohort = useCallback((answers: MCQAnswers) => {
    setMcqAnswers(answers);
    setAppState("dashboard");
  }, []);

  const handleReset = useCallback(() => {
    setAppState("landing");
    setStudyConfig({ productIdea: "", targetAudience: "", cohortSize: 20 });
    setMcqForm(null);
    setMcqAnswers({});
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      {appState === "landing" && (
        <LandingPage 
          onInitialize={handleInitializeStudy} 
          isInitializing={isInitializing} 
        />
      )}
      {appState === "refinement" && (
        <ContextRefinement
          config={studyConfig}
          mcqForm={mcqForm!}
          onGenerateCohort={handleGenerateCohort}
        />
      )}
      {appState === "dashboard" && (
        <Dashboard
          config={studyConfig}
          mcqForm={mcqForm!}
          mcqAnswers={mcqAnswers}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
