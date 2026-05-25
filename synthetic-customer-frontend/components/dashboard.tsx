"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  RotateCcw,
  Lightbulb,
  Route,
  Users,
  Target,
} from "lucide-react";
import type { StudyConfig, MCQAnswers, StudyMCQSchema } from "@/app/page";
import { TabIdea } from "@/components/tabs/tab-idea";
import { TabJourney } from "@/components/tabs/tab-journey";
import { TabCohort } from "@/components/tabs/tab-cohort";
import { TabFidelity } from "@/components/tabs/tab-fidelity";
import { WorkedIdeasDropdown } from "@/components/worked-ideas-dropdown";
import { PersonaModal } from "@/components/persona-modal";
import { PersonaZooZoo } from "@/components/ui/persona-zoozoo";
import type { SavedStudy } from "@/app/page";

export interface OceanProfile {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  profileSummary: string;
}

export interface Persona {
  id: string;
  name: string;
  age: number;
  occupation: string;
  location: string;
  incomeBracket: string;
  techSavviness: number;
  communicationStyle: string;
  currentSolution: string;
  relationshipWithMoney: string;
  biggestProfessionalFrustration: string;
  awarenessOfProblem: string;
  trustStyle: string;
  dealbreaker: string;
  oceanProfile: OceanProfile;
}

export interface Objection {
  objection: string;
  severity: string;
  wouldOvercomeIf: string;
}

export interface MCQTranscriptItem {
  question: string;
  options: string[];
  selectedOption: string;
  personaResponse: string;
}

export interface PersonaFeedback {
  personaId: string;
  likelihoodToBuy: number;
  priceReaction: string;
  wouldTryFreeTrial: boolean;
  overallStatement: string;
  mcqTranscript: MCQTranscriptItem[];
  featuresShouldHave: string[];
  featuresShouldNotHave: string[];
  topObjections: Objection[];
  awarenessShift: string;
}

export interface ObjectionCluster {
  theme: string;
  frequency: number;
  personaIds: string[];
  summary: string;
}

export interface PositiveSignal {
  signal: string;
  personaIds: string[];
  evidence: string;
}

export interface SurprisingOutlier {
  personaId: string;
  expectedBehaviour: string;
  actualBehaviour: string;
  implication: string;
}

export interface Synthesis {
  objectionClusters: ObjectionCluster[];
  positiveSignals: PositiveSignal[];
  surprisingOutliers: SurprisingOutlier[];
  criticalRisk: string;
  executiveSummary: string;
  fidelity?: any; // To avoid importing the exact type if it's complex, or we can use it
}

interface DashboardProps {
  config: StudyConfig;
  mcqForm: StudyMCQSchema;
  mcqAnswers: MCQAnswers;
  activeStudyId: string | null;
  onReset: () => void;
  initialPersonas?: Persona[];
  initialFeedbacks?: PersonaFeedback[];
  initialSynthesis?: Synthesis | null;
  onUpdateStudyData?: (personas: Persona[], feedbacks: PersonaFeedback[], synthesis: Synthesis | null) => void;
  savedStudies: SavedStudy[];
  onLoadStudy: (study: SavedStudy) => void;
  onDeleteStudy: (studyId: string) => void;
}

export function Dashboard({ 
  config, 
  mcqForm, 
  mcqAnswers, 
  onReset, 
  initialPersonas = [],
  initialFeedbacks = [],
  initialSynthesis = null,
  onUpdateStudyData,
  savedStudies,
  activeStudyId,
  onLoadStudy,
  onDeleteStudy
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState(initialPersonas.length > 0 ? "cohort" : "journey");
  
  // State for simulated cohort data
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [visiblePersonas, setVisiblePersonas] = useState<Persona[]>(initialPersonas);
  const [feedbacks, setFeedbacks] = useState<PersonaFeedback[]>(initialFeedbacks);
  const [synthesis, setSynthesis] = useState<Synthesis | null>(initialSynthesis);
  
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(initialPersonas.length === 0);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(initialFeedbacks.length > 0);
  const [showSynthesisTab, setShowSynthesisTab] = useState(initialSynthesis !== null);

  const [activeStep, setActiveStep] = useState(initialPersonas.length > 0 ? 4 : 1);
  const [completedSteps, setCompletedSteps] = useState<number[]>(initialPersonas.length > 0 ? [1, 2, 3] : []);
  const [isFadingTimeline, setIsFadingTimeline] = useState(initialPersonas.length > 0);
  
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const generationStartedRef = useRef(false);
  const isMountedRef = useRef(true);
  const lastSyncedStudyIdRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync internal state when loaded study props change
  useEffect(() => {
    const studyIdChanged = lastSyncedStudyIdRef.current !== activeStudyId;
    lastSyncedStudyIdRef.current = activeStudyId;

    setPersonas(initialPersonas);
    setVisiblePersonas(initialPersonas);
    setFeedbacks(initialFeedbacks);
    setSynthesis(initialSynthesis);
    setIsLoadingPersonas(initialPersonas.length === 0);
    setHasFeedback(initialFeedbacks.length > 0);
    setShowSynthesisTab(initialSynthesis !== null);

    // Only update tab and step progress if the study actually changed,
    // or if we have personas loaded (so we can show the cohort),
    // or if we are not in the middle of generating personas.
    if (studyIdChanged || initialPersonas.length > 0) {
      setActiveTab(initialPersonas.length > 0 ? "cohort" : "journey");
      setActiveStep(initialPersonas.length > 0 ? 4 : 1);
      setCompletedSteps(initialPersonas.length > 0 ? [1, 2, 3] : []);
      setIsFadingTimeline(initialPersonas.length > 0);
    }
  }, [activeStudyId, initialPersonas, initialFeedbacks, initialSynthesis]);

  // Trigger Phase 1: Persona Generation on mount
  useEffect(() => {
    if (initialPersonas.length > 0) return; // Skip if already loaded
    if (generationStartedRef.current) return;
    generationStartedRef.current = true;

    setCompletedSteps([1]);
    setActiveStep(2);

    async function triggerPersonaSimulation() {
      try {
        console.log("==================================================");
        console.log("🚀 [FRONTEND] Initiating Phase 1: Persona Generation Only...");
        console.log("==================================================");

        console.log(`Drafting customer cohort architecture (Cloud APIs)...`, { id: "persona-loader" });
        
        const response = await fetch("http://localhost:8000/api/v1/study/generate-personas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studyId: activeStudyId,
            projectName: config.projectName,
            productIdea: config.productIdea,
            targetAudience: config.targetAudience,
            cohortSize: Number(config.cohortSize),
            mcqAnswers,
            mcqForm,
          }),
        });

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || `HTTP error ${response.status}`);
        }

        const data = await response.json();
        
        if (!isMountedRef.current) return;

        const fetchedPersonas = data.personas;
        setPersonas(fetchedPersonas);
        setIsLoadingPersonas(false);
        console.log("Cohort personas successfully compiled!", { id: "persona-loader" });

        setCompletedSteps((prev) => [...prev, 2]);
        setActiveStep(3);

        let i = 0;
        const interval = setInterval(() => {
          if (!isMountedRef.current) {
            clearInterval(interval);
            return;
          }
          if (i < fetchedPersonas.length) {
            setVisiblePersonas((prev) => {
              const currentPersona = fetchedPersonas[i];
              if (!currentPersona) return prev;
              if (!prev.find(p => p && p.id === currentPersona.id)) {
                return [...prev, currentPersona];
              }
              return prev;
            });
            i++;
          } else {
            clearInterval(interval);
            
            if (onUpdateStudyData) {
              onUpdateStudyData(fetchedPersonas, feedbacks, synthesis);
            }

            setCompletedSteps((prev) => [...prev, 3]);
            setActiveStep(4);
            
            setTimeout(() => {
              if (isMountedRef.current) {
                setIsFadingTimeline(true);
                setTimeout(() => {
                  if (isMountedRef.current) {
                    setActiveTab("cohort");
                  }
                }, 1000);
              }
            }, 500);
          }
        }, 150);

      } catch (err: any) {
        if (!isMountedRef.current) return;
        setIsLoadingPersonas(false);
        console.error("Persona simulation error:", err);
        console.error("Cohort persona creation failed.", {
          id: "persona-loader",
          description: err.message || "Please make sure your FastAPI service is running on port 8000.",
        });
      }
    }

    triggerPersonaSimulation();
  }, [config, mcqAnswers, mcqForm]);

  // Trigger Phase 2: Feedbacks Loop simulation
  const handleGetIndividualFeedback = async () => {
    setIsLoadingFeedback(true);
    console.log("Deploying parallel feedback simulation threads...", { id: "feedback-loader" });
    try {
      const response = await fetch("http://localhost:8000/api/v1/study/generate-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName: config.projectName,
          productIdea: config.productIdea,
          targetAudience: config.targetAudience,
          mcqAnswers,
          mcqForm,
          personas: personas,
          studyId: activeStudyId
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Failed to generate feedbacks");
      }

      const data = await response.json();
      setFeedbacks(data.feedback);
      setSynthesis(data.synthesis);
      setHasFeedback(true);
      console.log("Simulations complete! Full customer profiles unlocked.", { id: "feedback-loader" });

      if (onUpdateStudyData) {
        onUpdateStudyData(personas, data.feedback, data.synthesis);
      }
    } catch (err: any) {
      console.error("Feedback loops simulation error:", err);
      console.error("Feedback simulation failed to complete.", {
        id: "feedback-loader",
        description: err.message || "Verify your API services.",
      });
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleGetSynthesis = () => {
    setShowSynthesisTab(true);
    // Smooth scroll/transition to Idea Analysis tab
    setTimeout(() => {
      setActiveTab("idea");
    }, 100);
    console.log("Synthesis analysis loaded!");
  };

  // Progressive list of visible tabs
  const visibleTabs = [];
  if (activeTab !== "journey") {
    visibleTabs.push({ id: "cohort", label: "The Cohort", icon: Users });
    if (hasFeedback) {
      visibleTabs.push({ id: "fidelity", label: "Fidelity Score", icon: Target });
    }
    if (showSynthesisTab) {
      visibleTabs.push({ id: "idea", label: "Synthesis", icon: Lightbulb });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold tracking-tight hidden sm:inline">
              SynthIQ
            </span>
          </div>

          {/* New study and history actions in header */}
          <div className="flex items-center gap-3">
            <WorkedIdeasDropdown
              studies={savedStudies}
              activeStudyId={activeStudyId}
              onLoadStudy={onLoadStudy}
              onDeleteStudy={onDeleteStudy}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground border border-border/20 bg-background hover:bg-muted"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Study
            </Button>
          </div>
        </div>
      </header>

      {/* User Product Idea Highlight Bar */}
      <div className="bg-gradient-to-r from-muted/40 via-muted/20 to-transparent border-b border-border/80 py-6 px-6 animate-in fade-in slide-in-from-top-1 duration-500">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
              Active Research Objective
            </span>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground leading-tight mb-2">
                  {config.projectName}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {config.productIdea}
                </p>
              </div>
              
              <div className="flex flex-col gap-3 shrink-0 lg:max-w-md bg-background/50 p-4 rounded-xl border border-border/50">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Target Audience
                  </span>
                  <span className="text-sm font-medium text-foreground leading-relaxed">
                    {config.targetAudience}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Cohort Size
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {config.cohortSize} personas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Progressive Revealer) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {activeTab !== "journey" && (
          <div className="border-b border-border bg-card/50">
            <div className="max-w-7xl mx-auto px-6">
              <TabsList className="h-14 bg-transparent p-0 gap-0 w-full justify-start rounded-none">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="h-14 px-6 rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <TabsContent value="journey" className="mt-0 relative min-h-[550px] flex items-center justify-center">
            {/* Personas Background representing progressive generation */}
            <div className="absolute inset-0 filter opacity-60 pointer-events-none select-none overflow-hidden transition-all duration-1000">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
                {visiblePersonas.map((p, index) => (
                  <div key={p?.id || index} className="bg-card border border-border/80 rounded-xl p-5 text-left transition-all duration-500 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {p?.name ? p.name.split(" ").map(n => n[0]).join("") : ""}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{p?.name || "Generating..."}</p>
                        <p className="text-xs text-muted-foreground">{p?.age || "--"} yrs old</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p?.occupation || ""}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Journey Timeline centered overlay with fade effect */}
            <div className={`relative z-10 w-full transition-all duration-1000 ${
              isFadingTimeline ? "opacity-0 scale-95 blur-sm" : "opacity-100 scale-100"
            }`}>
              <TabJourney activeStep={activeStep} completedSteps={completedSteps} />
            </div>
          </TabsContent>

          <TabsContent value="idea" className="mt-0">
            <TabIdea 
              config={config} 
              synthesis={synthesis} 
              personas={personas}
              onSelectPersona={setSelectedPersona}
              onViewFidelity={() => {
                setActiveTab("fidelity");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </TabsContent>

          <TabsContent value="cohort" className="mt-0">
            <TabCohort 
              personas={personas} 
              feedback={feedbacks}
              isSimulatingFeedback={isLoadingFeedback}
              onGetFeedback={handleGetIndividualFeedback}
              onGetSynthesis={handleGetSynthesis}
              showSynthesisTab={showSynthesisTab}
              onSelectPersona={setSelectedPersona}
            />
          </TabsContent>



          <TabsContent value="fidelity" className="mt-0">
            <TabFidelity 
              fidelityData={synthesis?.fidelity} 
              cohortSize={personas.length || Number(config.cohortSize) || 0}
            />
          </TabsContent>
        </div>
      </Tabs>
      
      <PersonaModal 
        selectedPersona={selectedPersona} 
        setSelectedPersona={setSelectedPersona} 
        feedback={feedbacks} 
        activeStudyId={activeStudyId}
      />
    </div>
  );
}

