"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  X, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle, 
  Sparkles,
  TrendingUp,
  Brain,
  Shield,
  Briefcase,
  PiggyBank,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import type { Persona, PersonaFeedback } from "@/components/dashboard";
import { PersonaZooZoo } from "@/components/ui/persona-zoozoo";

interface TabCohortProps {
  personas: Persona[];
  feedback: PersonaFeedback[];
  isSimulatingFeedback: boolean;
  onGetFeedback: () => void;
  onGetSynthesis: () => void;
  showSynthesisTab: boolean;
  onSelectPersona: (persona: Persona) => void;
}

export function TabCohort({
  personas,
  feedback,
  isSimulatingFeedback,
  onGetFeedback,
  onGetSynthesis,
  showSynthesisTab,
  onSelectPersona,
}: TabCohortProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [alertedId, setAlertedId] = useState<string | null>(null);

  const handleCardClick = (persona: Persona) => {
    setAlertedId(persona.id);
    setTimeout(() => {
      onSelectPersona(persona);
    }, 300); // 300ms delay to show the alert reaction
    
    setTimeout(() => {
      setAlertedId(null);
    }, 1500);
  };

  const getZooZooActivity = (index: number): 'pacer' | 'kicker' | 'bouncer' | 'greeter' => {
    const activities: ('pacer' | 'kicker' | 'bouncer' | 'greeter')[] = ['pacer', 'kicker', 'bouncer', 'greeter'];
    return activities[index % activities.length];
  };

  const getZooZooPoseClass = (activity: string) => {
    switch(activity) {
      case 'pacer':
        return "absolute -top-[44px] left-0 right-0 flex justify-center z-20 scale-90";
      case 'kicker':
        return "absolute -top-7 -right-3 z-20 scale-90";
      case 'bouncer':
        return "absolute -bottom-2 -right-4 z-20 scale-90 animate-bounce";
      case 'greeter':
        return "absolute top-1/2 -left-8 -translate-y-1/2 z-20 scale-90";
      default:
        return "";
    }
  };

  // Staggered load animation when personas change
  useEffect(() => {
    setVisibleCount(0);
    if (personas.length === 0) return;

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= personas.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [personas]);



  const OceanBar = ({ value, label }: { value: number; label: string }) => (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-foreground/80 to-foreground rounded-full transition-all duration-500"
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground w-4 text-right">{value}</span>
    </div>
  );

  return (
    <div className="relative">
      {personas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Sparkles className="w-8 h-8 animate-pulse mb-3" />
          <p className="text-sm">Synthesizing customer cohort profiles...</p>
        </div>
      ) : (
        /* Persona Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10 sm:gap-12 pt-16 pb-8">
          {personas.slice(0, visibleCount).map((persona, index) => {
            if (!persona) return null;
            const matchFeedback = feedback.find((f) => f.personaId === persona.id);
            return (
              <div 
                key={persona.id || index}
                id={`persona-card-${persona.id}`}
                className="relative animate-in fade-in slide-in-from-bottom-2 isolate"
                style={{ animationDelay: `${index * 15}ms` }}
              >
                {/* Scattered ZooZoo */}
                <div className={`pointer-events-auto ${getZooZooPoseClass(getZooZooActivity(index))} transition-all duration-300 ${alertedId === persona.id ? 'scale-110 z-30' : ''}`}>
                  <PersonaZooZoo 
                    incomeBracket={persona.incomeBracket} 
                    isAlerted={alertedId === persona.id}
                    activity={getZooZooActivity(index)}
                    onClick={() => handleCardClick(persona)}
                  />
                </div>

                <button
                  onClick={() => handleCardClick(persona)}
                  className="w-full bg-card border border-border/80 rounded-xl p-5 text-left hover:border-foreground/30 hover:shadow-md transition-all duration-300 relative group overflow-hidden z-10"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-foreground/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  {/* Card Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center overflow-hidden relative">
                      <PersonaZooZoo 
                        incomeBracket={persona.incomeBracket} 
                        activity="idle"
                        variant="headshot"
                        className="w-full h-full" 
                      />
                    </div>
                    <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate group-hover:text-foreground/95">
                      {persona.name || "Generating..."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {persona.age || "--"} yrs old • {persona.location || "Unknown"}
                    </p>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground font-medium mb-1 truncate">
                  {persona.occupation}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-bold uppercase tracking-wider">
                    {persona.incomeBracket}
                  </span>
                  {matchFeedback && (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                      ★ {matchFeedback.likelihoodToBuy}/5
                    </span>
                  )}
                </div>
                
                {/* Mini OCEAN Preview - Only show if feedbacks loaded */}
                {feedback.length > 0 && (
                  <div className="space-y-1 pt-3 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-muted-foreground w-8 uppercase">OPEN</span>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/60 rounded-full"
                          style={{ width: `${persona.oceanProfile.openness * 10}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-muted-foreground w-8 uppercase">CONS</span>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/60 rounded-full"
                          style={{ width: `${persona.oceanProfile.conscientiousness * 10}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-muted-foreground w-8 uppercase">NEUR</span>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/60 rounded-full"
                          style={{ width: `${persona.oceanProfile.neuroticism * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Progressive CTA Banners under persona grid */}
      {personas.length > 0 && (
        <div className="mt-12 flex justify-center w-full">
          {feedback.length === 0 ? (
            <div className="w-full max-w-xl bg-card border border-border/80 rounded-2xl p-8 text-center shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />
              <Sparkles className="w-7 h-7 mx-auto text-violet-500 mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-foreground mb-1.5">Deploy Customer Feedback Loop</h3>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed max-w-md mx-auto">
                Simulate in-depth user interviews for all {personas.length} personas in parallel. Unlock detailed purchase intent, MUST-HAVE integrations, absolute dealbreakers, and deep psychological feedback.
              </p>
              <button
                onClick={onGetFeedback}
                disabled={isSimulatingFeedback}
                className="w-full sm:w-auto min-w-[220px] h-11 px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm flex items-center justify-center gap-2 mx-auto"
              >
                {isSimulatingFeedback ? (
                  <>
                    <span className="w-4.5 h-4.5 border-2 border-background/20 border-t-background rounded-full animate-spin shrink-0" />
                    Simulating Interviews...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 shrink-0" />
                    Get Individual Feedback
                  </>
                )}
              </button>
            </div>
          ) : (
            !showSynthesisTab && (
              <div className="w-full max-w-xl bg-card border border-border/80 rounded-2xl p-8 text-center shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
                <Sparkles className="w-7 h-7 mx-auto text-emerald-500 mb-3 animate-bounce" />
                <h3 className="text-base font-bold text-foreground mb-1.5">Perform Overall Cohort Synthesis</h3>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed max-w-md mx-auto">
                  Consolidate qualitative insights from all simulated feedback loops. Cluster core objections, identify positive signals, and construct the final synthesis dashboard.
                </p>
                <button
                  onClick={onGetSynthesis}
                  className="w-full sm:w-auto min-w-[220px] h-11 px-6 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 mx-auto"
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  Perform Overall Analysis
                </button>
              </div>
            )
          )}
        </div>
      )}

    </div>
  );
}
