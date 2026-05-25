"use client";

import { useState, useEffect, useCallback } from "react";
import { LandingPage } from "@/components/landing-page";
import { ContextRefinement } from "@/components/context-refinement";
import { Dashboard } from "@/components/dashboard";
import type { Persona, PersonaFeedback, Synthesis } from "@/components/dashboard";

export type AppState = "landing" | "refinement" | "dashboard";

export interface StudyConfig {
  projectName: string;
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

export interface SavedStudy {
  studyId: string;
  timestamp: number;
  config: StudyConfig;
  mcqForm: StudyMCQSchema | null;
  mcqAnswers: MCQAnswers;
  appState: AppState;
  personas: Persona[];
  feedbacks: PersonaFeedback[];
  synthesis: Synthesis | null;
}

const STORAGE_KEY = "synthetic_customer_studies";
const EMPTY_ARRAY: any[] = [];

export default function SyntheticCustomer() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [isInitializing, setIsInitializing] = useState(false);
  const [studyConfig, setStudyConfig] = useState<StudyConfig>({
    projectName: "",
    productIdea: "",
    targetAudience: "",
    cohortSize: 20,
  });
  const [mcqForm, setMcqForm] = useState<StudyMCQSchema | null>(null);
  const [mcqAnswers, setMcqAnswers] = useState<MCQAnswers>({});
  const [savedStudies, setSavedStudies] = useState<SavedStudy[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null);

  // Load saved studies from backend on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch("http://localhost:8000/api/v1/study/history", {
          cache: "no-store"
        });
        if (response.ok) {
          const data = await response.json();
          setSavedStudies(data);
        } else {
          // fallback to localStorage if backend fails
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) setSavedStudies(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load studies from backend:", e);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setSavedStudies(JSON.parse(stored));
      }
    }
    loadHistory();
  }, []);

  // Update page title dynamically based on active state and open project
  useEffect(() => {
    if (appState === "landing") {
      document.title = "SynthIQ";
    } else if (studyConfig.projectName) {
      document.title = studyConfig.projectName;
    } else {
      document.title = "SynthIQ";
    }
  }, [appState, studyConfig.projectName]);

  // Save/Update study in history
  const saveStudy = useCallback((study: SavedStudy) => {
    setSavedStudies((prev) => {
      const exists = prev.some((s) => s.studyId === study.studyId);
      const updated = exists
        ? prev.map((s) => (s.studyId === study.studyId ? study : s))
        : [...prev, study];
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to write studies to local storage:", e);
      }
      return updated;
    });
  }, []);

  // Update parts of saved study
  const updateSavedStudy = useCallback((studyId: string, updates: Partial<SavedStudy>) => {
    setSavedStudies((prev) => {
      const updated = prev.map((s) => {
        if (s.studyId === studyId) {
          const merged = { ...s, ...updates };
          return merged;
        }
        return s;
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update study in local storage:", e);
      }
      return updated;
    });
  }, []);

  const handleReset = useCallback(() => {
    setAppState("landing");
    setStudyConfig({ projectName: "", productIdea: "", targetAudience: "", cohortSize: 20 });
    setMcqForm(null);
    setMcqAnswers({});
    setActiveStudyId(null);
  }, []);

  // Delete study from history
  const handleDeleteStudy = useCallback(async (studyId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/study/${studyId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
      }

      setSavedStudies((prev) => {
        const updated = prev.filter((s) => s.studyId !== studyId);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to delete study from local storage:", e);
        }
        return updated;
      });

      if (activeStudyId === studyId) {
        handleReset();
      }
      console.log("Study deleted from history.");
    } catch (e) {
      console.error("Failed to delete study from backend:", e);
      alert("Failed to delete the study. Please try again or check if the server is running.");
    }
  }, [activeStudyId, handleReset]);

  // Load saved study state
  const handleLoadStudy = useCallback(async (studySummary: SavedStudy) => {
    try {
      console.log("Loading study details...", { id: "load-study" });
      const response = await fetch(`http://localhost:8000/api/v1/study/${studySummary.studyId}`, {
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Failed to fetch study details");
      const fullStudy = await response.json();
      
      setStudyConfig(fullStudy.config);
      setMcqForm(fullStudy.mcqForm);
      setMcqAnswers(fullStudy.mcqAnswers || {});
      setActiveStudyId(fullStudy.studyId);
      setAppState(fullStudy.appState || "dashboard");
      
      setSavedStudies(prev => prev.map(s => s.studyId === fullStudy.studyId ? fullStudy : s));
      
      console.log("Research study successfully loaded!", { id: "load-study" });
    } catch (e) {
      console.error(e);
      console.error("Failed to load study details from DB. Using cached version if available.", { id: "load-study" });
      
      // Fallback
      setStudyConfig(studySummary.config);
      setMcqForm(studySummary.mcqForm);
      setMcqAnswers(studySummary.mcqAnswers);
      setActiveStudyId(studySummary.studyId);
      setAppState(studySummary.appState);
    }
  }, []);

  const handleInitializeStudy = useCallback(async (config: StudyConfig) => {
    setIsInitializing(true);
    
    console.log("==================================================");
    console.log("🚀 [FRONTEND] Step 1: Initiating Study Initialization...");
    console.log("👉 Parameters to submit:", config);
    console.log("==================================================");
    
    console.log(`Initializing Study Framework on backend (Cloud APIs)...`, { id: "init-study" });

    try {
      const apiUrl = "http://localhost:8000/api/v1/study/initialize";
      console.log(`📡 [FRONTEND] Step 2: Sending HTTP POST request to API -> ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      console.log(`📡 [FRONTEND] Step 3: Server responded with HTTP status ${response.status} (${response.statusText})`);

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Server returned error status ${response.status}: ${errorDetail}`);
      }

      const data = await response.json();
      console.log(`✅ [FRONTEND] Step 4: Study initialized successfully on the backend!`);
      console.log("📦 [FRONTEND] Received study payload:", data);
      console.log(`🔑 [FRONTEND] Generated Study ID (UUID): ${data.study_id}`);
      console.log("==================================================");

      console.log("Study Framework initialized successfully!", {
        id: "init-study",
        description: `Study ID: ${data.study_id.substring(0, 8)}...`,
      });

      const newStudy: SavedStudy = {
        studyId: data.study_id,
        timestamp: Date.now(),
        config: config,
        mcqForm: data.mcqForm,
        mcqAnswers: {},
        appState: "refinement",
        personas: [],
        feedbacks: [],
        synthesis: null,
      };

      saveStudy(newStudy);
      setActiveStudyId(data.study_id);
      setStudyConfig(config);
      setMcqForm(data.mcqForm);
      setAppState("refinement");
    } catch (err: any) {
      console.error("❌ [FRONTEND] Step 5: Study Initialization failed!");
      console.error("👉 Error details:", err);
      console.log("==================================================");

      console.error("Failed to initialize study framework.", {
        id: "init-study",
        description: err?.message || "Verify the FastAPI server is running on port 8000.",
      });
    } finally {
      setIsInitializing(false);
    }
  }, [saveStudy]);

  const handleGenerateCohort = useCallback((answers: MCQAnswers, updatedForm: StudyMCQSchema) => {
    setMcqAnswers(answers);
    setMcqForm(updatedForm);
    setAppState("dashboard");

    if (activeStudyId) {
      updateSavedStudy(activeStudyId, {
        mcqAnswers: answers,
        mcqForm: updatedForm,
        appState: "dashboard",
      });
    }
  }, [activeStudyId, updateSavedStudy]);


  const handleUpdateStudyData = useCallback((personas: Persona[], feedbacks: PersonaFeedback[], synthesis: Synthesis | null) => {
    if (activeStudyId) {
      updateSavedStudy(activeStudyId, {
        personas,
        feedbacks,
        synthesis,
      });
    }
  }, [activeStudyId, updateSavedStudy]);

  const activeStudy = savedStudies.find((s) => s.studyId === activeStudyId) || null;

  return (
    <main className="min-h-screen bg-background">
      {appState === "landing" && (
        <LandingPage 
          onInitialize={handleInitializeStudy} 
          isInitializing={isInitializing}
          savedStudies={savedStudies}
          activeStudyId={activeStudyId}
          onLoadStudy={handleLoadStudy}
          onDeleteStudy={handleDeleteStudy}
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
          initialPersonas={activeStudy?.personas || EMPTY_ARRAY}
          initialFeedbacks={activeStudy?.feedbacks || EMPTY_ARRAY}
          initialSynthesis={activeStudy?.synthesis || null}
          onUpdateStudyData={handleUpdateStudyData}
          savedStudies={savedStudies}
          activeStudyId={activeStudyId}
          onLoadStudy={handleLoadStudy}
          onDeleteStudy={handleDeleteStudy}
        />
      )}
    </main>
  );
}
