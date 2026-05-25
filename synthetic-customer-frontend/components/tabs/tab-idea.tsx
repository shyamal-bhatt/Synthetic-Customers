"use client";

import { useEffect, useState } from "react";
import { 
  Clock, 
  DollarSign, 
  Users, 
  Globe, 
  AlertOctagon, 
  TrendingUp, 
  AlertTriangle, 
  UserCheck,
  Lightbulb,
  Sparkles
} from "lucide-react";
import type { StudyConfig } from "@/app/page";
import type { Persona, Synthesis } from "@/components/dashboard";
import { FidelityMeter } from "@/components/ui/fidelity-meter";

interface TabIdeaProps {
  config: StudyConfig;
  synthesis: Synthesis | null;
  personas: Persona[];
  onSelectPersona: (persona: Persona) => void;
  onViewFidelity?: () => void;
}

export function TabIdea({ config, synthesis, personas, onSelectPersona, onViewFidelity }: TabIdeaProps) {
  const fullText = synthesis?.executiveSummary || "Synthesizing research results...";

  if (!synthesis) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Sparkles className="w-8 h-8 animate-pulse mb-3" />
        <p className="text-sm">Synthesizing simulation results...</p>
      </div>
    );
  }

  // Calculate Fidelity Trust Meter Props
  const fidelityData = synthesis.fidelity;
  let totalScore = 0;
  let totalLabel = "Unreliable";
  let totalStatus: "high" | "mid" | "low" = "low";
  let weakestDimension = null;
  let cohortSizeNote = null;

  if (fidelityData) {
    totalScore = fidelityData.finalScore !== undefined 
      ? fidelityData.finalScore 
      : (fidelityData.final_score !== undefined ? fidelityData.final_score : 0);

    const labelMapping = (score: number) => {
      if (score >= 90) return "High fidelity";
      if (score >= 75) return "Good fidelity";
      if (score >= 60) return "Moderate fidelity";
      if (score >= 40) return "Low fidelity";
      return "Unreliable";
    };
    totalLabel = labelMapping(totalScore);

    const getStatus = (score: number) => {
      if (score >= 80) return "high";
      if (score >= 50) return "mid";
      return "low";
    };
    totalStatus = getStatus(totalScore);

    const dims = fidelityData.dimensions || {};
    const scoreVariance = dims.scoreVariance || dims.score_variance || { score: 0, evidence: "" };
    const profileCoherence = dims.profileCoherence || dims.profile_coherence || { score: 0, evidence: "" };
    const objectionDiversity = dims.objectionDiversity || dims.objection_diversity || { score: 0, evidence: "" };
    const oceanAlignment = dims.oceanAlignment || dims.ocean_alignment || { score: 0, evidence: "" };
    const personaDistinctiveness = dims.personaDistinctiveness || dims.persona_distinctiveness || { score: 0, evidence: "" };

    const cohortSize = personas.length || Number(config.cohortSize) || 0;

    const scoreSpreadExplanation = scoreVariance.score >= 80
      ? "Persons scored dynamically with distinct high/low intent. Real audiences always have enthusiasts and rejectors, proving this cohort avoided artificial consensus."
      : `5 out of ${cohortSize} personas gave a likelihood of 2/5. Real audiences always have enthusiasts and hard rejectors. This cohort avoided strong opinions — a common AI pattern.`;

    const profileCoherenceExplanation = profileCoherence.score >= 80
      ? `All ${cohortSize} personas gave feedback that matched who they are — price-sensitive personas reacted to price, skeptical personas raised objections. No contradictions found.`
      : "Multiple personas gave feedback contradicting their traits (e.g. price-sensitive personas accepting high prices). Inconsistent profiles make results hard to trust.";

    const objectionDiversityExplanation = objectionDiversity.score >= 80
      ? "Objections were highly personalized to individual circumstances with a variety of concerns. A wide spread of objections ensures that you capture full qualitative market risks."
      : "Integration (×7), ROI validation (×5), and complex setup (×3) dominated. When most personas share the same objections, it's hard to know if these are real signals or AI defaults.";

    const oceanAlignmentExplanation = oceanAlignment.score >= 80
      ? "Every persona with extreme personality traits behaved consistently with them. The skeptical personas pushed back, the risk-averse ones raised security concerns."
      : "Extreme personality trait scores did not produce distinct tones or feedback. When personality scores are decorative, the cohort's qualitative feedback lacks behavioral realism.";

    const distinctivenessExplanation = personaDistinctiveness.score >= 80
      ? "Feedback statements are highly varied in length, sentence structure, and vocabulary. Distinct writing styles suggest natural, human-like voice synthesis."
      : "Most feedback follows the same structure: raise a concern, justify it, add a condition. Over half start with \"I am\" or \"I am not.\" Different people speak differently.";

    let weakestKey = fidelityData.primaryWeakness || fidelityData.primary_weakness;
    if (!weakestKey || weakestKey === "none") {
      const entries = [
        { key: "score_variance", score: scoreVariance.score },
        { key: "ocean_alignment", score: oceanAlignment.score },
        { key: "profile_coherence", score: profileCoherence.score },
        { key: "objection_diversity", score: objectionDiversity.score },
        { key: "persona_distinctiveness", score: personaDistinctiveness.score },
      ];
      entries.sort((a, b) => a.score - b.score);
      weakestKey = entries[0].key;
    }

    const normalizedWeakestKey = weakestKey.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);

    let display_name = "Objection diversity";
    let explanation = objectionDiversityExplanation;

    switch (normalizedWeakestKey) {
      case "score_variance":
      case "score_spread":
        display_name = "Score spread";
        explanation = scoreSpreadExplanation;
        break;
      case "ocean_alignment":
        display_name = "OCEAN alignment";
        explanation = oceanAlignmentExplanation;
        break;
      case "profile_coherence":
        display_name = "Profile coherence";
        explanation = profileCoherenceExplanation;
        break;
      case "objection_diversity":
        display_name = "Objection diversity";
        explanation = objectionDiversityExplanation;
        break;
      case "persona_distinctiveness":
      case "distinctiveness":
        display_name = "Persona distinctiveness";
        explanation = distinctivenessExplanation;
        break;
    }

    weakestDimension = {
      display_name,
      explanation,
    };

    cohortSizeNote = cohortSize < 10
      ? `Cohort size was ${cohortSize}. Scores for spread and diversity are harder to achieve below 10 personas — some of this penalty is statistical, not a quality issue. Try 10+ for a more accurate reading.`
      : null;
  }

  const stats = [
    {
      icon: Users,
      label: "Total Evaluated",
      value: `${config.cohortSize} customers`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: AlertTriangle,
      label: "Key Objection Themes",
      value: `${synthesis.objectionClusters?.length || 0}`,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: TrendingUp,
      label: "Positive Signals",
      value: `${synthesis.positiveSignals?.length || 0}`,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: UserCheck,
      label: "Surprising Outliers",
      value: `${synthesis.surprisingOutliers?.length || 0}`,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Visual Research Trust Meter */}
      {fidelityData && (
        <FidelityMeter
          total_score={totalScore}
          total_label={totalLabel}
          total_status={totalStatus}
          weakest_dimension={weakestDimension}
          cohort_size_note={cohortSizeNote}
          onViewFidelity={onViewFidelity}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border/80 rounded-xl p-5 hover:border-border transition-all duration-300 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground relative z-10 tracking-tight">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Critical Risk Banner */}
      {synthesis.criticalRisk && (
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm shadow-sm flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500" />
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1.5">
              Critical Adoption Risk
            </h4>
            <p className="text-sm text-foreground/90 leading-relaxed font-medium">
              {synthesis.criticalRisk}
            </p>
          </div>
        </div>
      )}

      {/* Executive Summary Card */}
      <div className="bg-card border border-border/80 rounded-xl p-8 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-foreground/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <h3 className="text-base font-bold text-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Product Analysis Summary
        </h3>
        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm md:text-base font-medium">
            {fullText}
          </p>
        </div>
      </div>

      {/* Insights Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positive Market Signals */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Positive Market Signals
          </h3>
          <div className="space-y-4">
            {synthesis.positiveSignals && synthesis.positiveSignals.length > 0 ? (
              synthesis.positiveSignals.map((signal, idx) => (
                <div 
                  key={idx} 
                  className="bg-card border border-border/80 rounded-xl p-5 hover:border-emerald-500/20 transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="font-semibold text-foreground text-sm group-hover:text-emerald-500 transition-colors">
                      {signal.signal}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 uppercase tracking-wider shrink-0">
                      {signal.personaIds.length} Customers
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {signal.evidence}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-card border border-border/80 rounded-xl p-5 text-center text-muted-foreground text-xs">
                No major positive signals identified yet.
              </div>
            )}
          </div>
        </div>

        {/* Objection Clusters */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Core Objection Clusters
          </h3>
          <div className="space-y-4">
            {synthesis.objectionClusters && synthesis.objectionClusters.length > 0 ? (
              synthesis.objectionClusters.map((cluster, idx) => (
                <div 
                  key={idx} 
                  className="bg-card border border-border/80 rounded-xl p-5 hover:border-amber-500/20 transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="font-semibold text-foreground text-sm group-hover:text-amber-500 transition-colors">
                      {cluster.theme}
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/10 text-amber-500 uppercase tracking-wider shrink-0">
                      {cluster.frequency} occurrences
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {cluster.summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.personaIds.map((pid) => {
                      const persona = personas.find(p => p.id === pid);
                      return (
                        <button 
                          key={pid} 
                          onClick={() => persona && onSelectPersona(persona)}
                          className="text-[10px] text-foreground/80 border border-border/80 px-2 py-1 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer text-left"
                        >
                          {persona ? <b>{persona.name}</b> : pid.replace("persona_", "P-")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card border border-border/80 rounded-xl p-5 text-center text-muted-foreground text-xs">
                No critical objection clusters generated.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Surprising Outliers */}
      {synthesis.surprisingOutliers && synthesis.surprisingOutliers.length > 0 && (
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-widest flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-violet-500" />
            Surprising Outliers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {synthesis.surprisingOutliers.map((outlier, idx) => (
              <div 
                key={idx} 
                className="bg-card border border-border/80 rounded-xl p-5 hover:border-violet-500/20 transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                  <button 
                    onClick={() => {
                      const persona = personas.find(p => p.id === outlier.personaId);
                      if (persona) onSelectPersona(persona);
                    }}
                    className="text-[11px] text-violet-500/90 tracking-wide hover:text-violet-500 transition-colors text-left"
                  >
                    Customer: {personas.find(p => p.id === outlier.personaId)?.name ? <b>{personas.find(p => p.id === outlier.personaId)?.name}</b> : outlier.personaId.replace("persona_", "P-")}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mb-1">
                      Expected Behavior
                    </p>
                    <p className="text-foreground/95 font-medium leading-relaxed">
                      {outlier.expectedBehaviour}
                    </p>
                  </div>
                  <div className="bg-violet-500/5 p-2.5 rounded-lg border border-violet-500/10">
                    <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wide mb-1">
                      Actual Behavior
                    </p>
                    <p className="text-foreground/95 font-medium leading-relaxed">
                      {outlier.actualBehaviour}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                  <span className="font-bold text-foreground/80">Implication: </span>
                  {outlier.implication}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
