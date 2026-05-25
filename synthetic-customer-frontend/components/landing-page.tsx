"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Zap, Users, Target, Lightbulb, Wand2, Loader2 } from "lucide-react";
import { WorkedIdeasDropdown } from "@/components/worked-ideas-dropdown";
import { CohortStage } from "@/components/cohort-stage";
import type { StudyConfig, SavedStudy } from "@/app/page";

interface LandingPageProps {
  onInitialize: (config: StudyConfig) => void;
  isInitializing?: boolean;
  savedStudies: SavedStudy[];
  activeStudyId: string | null;
  onLoadStudy: (study: SavedStudy) => void;
  onDeleteStudy: (studyId: string) => void;
}

export function LandingPage({ 
  onInitialize, 
  isInitializing = false,
  savedStudies,
  activeStudyId,
  onLoadStudy,
  onDeleteStudy
}: LandingPageProps) {
  const [projectName, setProjectName] = useState("");
  const [productIdea, setProductIdea] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [cohortSize, setCohortSize] = useState(20);

  // Micro-interaction states
  const [minutes, setMinutes] = useState(5);
  const [studiesCount, setStudiesCount] = useState(147);
  const [ghostText, setGhostText] = useState("");
  const [showThumbsUp, setShowThumbsUp] = useState(false);
  const [initStep, setInitStep] = useState(0);
  const [isGeneratingAudience, setIsGeneratingAudience] = useState(false);

  const handleGenerateAudience = async () => {
    if (!projectName.trim() || !productIdea.trim()) {
      return;
    }
    setIsGeneratingAudience(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/study/generate-target-audience", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          productIdea
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate target audience");
      }

      const data = await response.json();
      if (data.targetAudience) {
        setTargetAudience(data.targetAudience);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingAudience(false);
    }
  };

  const fullGhostText = "An AI app that builds a weekly grocery list from a photo of your fridge...";

  useEffect(() => {
    // 5 -> 4 -> 3 -> 4 -> 5 loop
    let dir = -1;
    let m = 5;
    const minInterval = setInterval(() => {
       m += dir;
       if (m <= 3) dir = 1;
       if (m >= 5) dir = -1;
       setMinutes(m);
    }, 2500);

    // Live counter
    const countInterval = setInterval(() => {
       if (Math.random() < 0.4) setStudiesCount(c => c + 1);
    }, 3500);

    return () => {
      clearInterval(minInterval);
      clearInterval(countInterval);
    };
  }, []);

  useEffect(() => {
    // Ghost typing
    if (productIdea.length > 0) return;
    let i = 0;
    const interval = setInterval(() => {
       i++;
       setGhostText(fullGhostText.slice(0, i));
       if (i > fullGhostText.length + 15) i = 0;
    }, 60);
    return () => clearInterval(interval);
  }, [productIdea]);

  useEffect(() => {
    // CTA Button morphing
    if (isInitializing) {
       const i1 = setTimeout(() => setInitStep(1), 1500);
       const i2 = setTimeout(() => setInitStep(2), 3500);
       return () => { clearTimeout(i1); clearTimeout(i2); };
    } else {
       setInitStep(0);
    }
  }, [isInitializing]);

  const handleProjectNameBlur = () => {
    if (projectName.trim()) {
       setShowThumbsUp(true);
       setTimeout(() => setShowThumbsUp(false), 3000);
    }
  };

  const handleSubmit = () => {
    if (projectName.trim() && productIdea.trim() && targetAudience.trim() && !isInitializing) {
      onInitialize({ projectName, productIdea, targetAudience, cohortSize });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              SynthIQ
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center mr-2">
              <WorkedIdeasDropdown
                studies={savedStudies}
                activeStudyId={activeStudyId}
                onLoadStudy={onLoadStudy}
                onDeleteStudy={onDeleteStudy}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm mb-6 transition-all">
            <Zap className="w-3 h-3" />
            <span className="tabular-nums">{studiesCount}</span> studies run today
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
            Test any product idea in <span className="inline-block min-w-[1.2ch] transition-all duration-700 ease-in-out">{minutes}</span> minutes
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Generate synthetic customer cohorts that simulate real user behavior.
            Get actionable insights without the wait.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-sm">
            <div className="space-y-8">
              {/* Project Name Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Project Name
                </label>
                <div className="relative">
                  <Input
                    placeholder="e.g. Smart Grocery App"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all pr-10"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onBlur={handleProjectNameBlur}
                    disabled={isInitializing}
                  />
                  {showThumbsUp && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in slide-in-from-bottom-2 fade-in duration-300">
                      <div className="relative w-5 h-5 flex items-center justify-center">
                        <div className="w-4 h-4 bg-foreground rounded-full"></div>
                        <div className="absolute -right-1 -top-1 text-[10px]">👍</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Idea Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-muted-foreground" />
                  Product Idea & Problem Statement
                </label>
                <div className="relative">
                  {!productIdea && (
                    <div className="absolute top-[9px] left-[13px] pointer-events-none text-muted-foreground/50 whitespace-pre-wrap text-sm z-0">
                      {ghostText}
                      <span className="animate-pulse">|</span>
                    </div>
                  )}
                  <Textarea
                    className="min-h-[140px] resize-none bg-transparent border-border text-foreground focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all relative z-10"
                    value={productIdea}
                    onChange={(e) => setProductIdea(e.target.value)}
                    disabled={isInitializing}
                  />
                </div>
              </div>

              {/* Target Audience Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Target Audience & Market
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={handleGenerateAudience}
                    disabled={isInitializing || isGeneratingAudience || !projectName.trim() || !productIdea.trim()}
                  >
                    {isGeneratingAudience ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    Auto-generate
                  </Button>
                </div>
                <Textarea
                  placeholder="Busy professionals aged 25-45 who want to eat healthier"
                  className="min-h-[100px] resize-none bg-transparent border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  disabled={isInitializing}
                />
              </div>

              {/* Cohort Size Selection */}
              <CohortStage 
                defaultValue={cohortSize} 
                onChange={setCohortSize} 
                disabled={isInitializing}
                isInitializing={isInitializing}
                targetAudience={targetAudience}
              />

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!projectName.trim() || !productIdea.trim() || !targetAudience.trim() || isInitializing}
                  className="group w-full h-14 text-base font-medium rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden"
                >
                  {/* Walking Silhouette on Hover */}
                  {!isInitializing && (
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
                       <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 animate-[walkRight_4s_linear_infinite]">
                         <svg viewBox="0 0 24 24" fill="currentColor" className="text-background/20 w-full h-full">
                           <circle cx="12" cy="8" r="4" />
                           <path d="M12 13c-3 0-5 2-5 5v3h10v-3c0-3-2-5-5-5z" />
                         </svg>
                       </div>
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-center">
                    {isInitializing ? (
                      <>
                        <span className="w-5 h-5 mr-3 border-2 border-background border-t-transparent rounded-full animate-spin"></span>
                        {initStep === 0 && "Initializing Framework..."}
                        {initStep === 1 && "Gathering personas..."}
                        {initStep === 2 && "Ready"}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Initialize Study Framework
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-xs text-muted-foreground mb-4">
            TRUSTED BY PRODUCT TEAMS AT
          </p>
          <div className="flex items-center justify-center gap-8 opacity-50">
            {["Stripe", "Vercel", "Linear", "Notion", "Figma"].map((brand) => (
              <span
                key={brand}
                className="text-sm font-medium text-muted-foreground"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
