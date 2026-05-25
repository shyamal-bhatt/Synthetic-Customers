"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, Lightbulb, BarChart3, Fingerprint, RefreshCw, Sparkles, Check } from "lucide-react";

interface FidelityDimension {
  score: number;
  evidence: string;
  [key: string]: any;
}

interface FidelityAssessmentData {
  dimensions: {
    scoreVariance?: FidelityDimension;
    score_variance?: FidelityDimension;
    profileCoherence?: FidelityDimension;
    profile_coherence?: FidelityDimension;
    objectionDiversity?: FidelityDimension;
    objection_diversity?: FidelityDimension;
    oceanAlignment?: FidelityDimension;
    ocean_alignment?: FidelityDimension;
    personaDistinctiveness?: FidelityDimension;
    persona_distinctiveness?: FidelityDimension;
  };
  finalScore?: number;
  final_score?: number;
  label?: string;
  primaryWeakness?: string;
  primary_weakness?: string;
  improvementNote?: string;
  improvement_note?: string;
}

interface TabFidelityProps {
  fidelityData?: FidelityAssessmentData;
  cohortSize?: number;
}

export function TabFidelity({ fidelityData, cohortSize = 6 }: TabFidelityProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Resolve raw data properties (handling both camelCase and snake_case)
  const dims = fidelityData?.dimensions || {};
  const scoreVariance = dims.scoreVariance || dims.score_variance || { score: 0, evidence: "" };
  const profileCoherence = dims.profileCoherence || dims.profile_coherence || { score: 0, evidence: "" };
  const objectionDiversity = dims.objectionDiversity || dims.objection_diversity || { score: 0, evidence: "" };
  const oceanAlignment = dims.oceanAlignment || dims.ocean_alignment || { score: 0, evidence: "" };
  const personaDistinctiveness = dims.personaDistinctiveness || dims.persona_distinctiveness || { score: 0, evidence: "" };

  const rawFinalScore = fidelityData?.finalScore !== undefined 
    ? fidelityData.finalScore 
    : (fidelityData?.final_score !== undefined ? fidelityData.final_score : 0);

  useEffect(() => {
    if (!fidelityData) {
      setShowDetails(true);
      return;
    }

    const duration = 1500;
    const steps = 60;
    const increment = rawFinalScore / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setAnimatedScore(Math.min(Math.round(increment * currentStep), rawFinalScore));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setShowDetails(true);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [fidelityData, rawFinalScore]);

  if (!fidelityData) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Fidelity Assessment Pending</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Fidelity data is calculated automatically after persona feedback loops have completed. Please run the feedback simulation to see your results.
        </p>
      </div>
    );
  }

  // Structuring Helper to enrich data per requirements
  const getStatus = (score: number) => {
    if (score >= 80) return "high";
    if (score >= 50) return "mid";
    return "low";
  };

  const getStatusColor = (status: string) => {
    if (status === "high") return "text-emerald-500";
    if (status === "mid") return "text-amber-500";
    return "text-rose-500";
  };

  const getStatusBg = (status: string) => {
    if (status === "high") return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    if (status === "mid") return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-rose-500/10 border-rose-500/20 text-rose-400";
  };

  const getBarBg = (status: string) => {
    if (status === "high") return "bg-emerald-500";
    if (status === "mid") return "bg-amber-500";
    return "bg-rose-500";
  };

  // Mappings
  const labelMapping = (score: number) => {
    if (score >= 90) return "High fidelity";
    if (score >= 75) return "Good fidelity";
    if (score >= 60) return "Moderate fidelity";
    if (score >= 40) return "Low fidelity";
    return "Unreliable";
  };

  const scoreSpreadVerdict = scoreVariance.score >= 80
    ? "✓ Healthy variation in purchase intent scores"
    : (scoreVariance.score >= 50
      ? "~ Moderate variation in purchase intent"
      : "⚠ Everyone scored too similarly");

  const scoreSpreadExplanation = scoreVariance.score >= 80
    ? `Persons scored dynamically with distinct high/low intent. Real audiences always have enthusiasts and rejectors, proving this cohort avoided artificial consensus.`
    : `5 out of ${cohortSize} personas gave a likelihood of 2/5. Real audiences always have enthusiasts and hard rejectors. This cohort avoided strong opinions — a common AI pattern.`;

  const scoreSpreadAction = scoreVariance.score >= 75
    ? "No action needed — this is working well"
    : `Re-run with cohort size 10+ to get more natural spread`;

  const profileCoherenceVerdict = profileCoherence.score >= 80
    ? "✓ Personas stayed true to their profiles"
    : (profileCoherence.score >= 50
      ? "~ Personas partially followed their profiles"
      : "⚠ low profile coherence detected");

  const profileCoherenceExplanation = profileCoherence.score >= 80
    ? `All ${cohortSize} personas gave feedback that matched who they are — price-sensitive personas reacted to price, skeptical personas raised objections. No contradictions found.`
    : `Multiple personas gave feedback contradicting their traits (e.g. price-sensitive personas accepting high prices). Inconsistent profiles make results hard to trust.`;

  const profileCoherenceAction = profileCoherence.score >= 75
    ? "No action needed — this is working well"
    : "Review failed persona definitions to check what contradictions were flagged";

  const objectionDiversityVerdict = objectionDiversity.score >= 80
    ? "✓ Excellent variety of objections raised"
    : (objectionDiversity.score >= 50
      ? "~ Objections show moderate diversity"
      : "⚠ Too many personas raised the same concerns");

  const objectionDiversityExplanation = objectionDiversity.score >= 80
    ? `Objections were highly personalized to individual circumstances with a variety of concerns. A wide spread of objections ensures that you capture full qualitative market risks.`
    : `Integration (×7), ROI validation (×5), and complex setup (×3) dominated. When most personas share the same objections, it's hard to know if these are real signals or AI defaults.`;

  const objectionDiversityAction = objectionDiversity.score >= 75
    ? "No action needed — this is working well"
    : "Add more audience specificity to get varied objections";

  const oceanAlignmentVerdict = oceanAlignment.score >= 80
    ? "✓ Personality scores drove behaviour correctly"
    : (oceanAlignment.score >= 50
      ? "~ Personality traits partially drove behaviour"
      : "⚠ Personality traits were ignored in feedback");

  const oceanAlignmentExplanation = oceanAlignment.score >= 80
    ? `Every persona with extreme personality traits behaved consistently with them. The skeptical personas pushed back, the risk-averse ones raised security concerns.`
    : `Extreme personality trait scores did not produce distinct tones or feedback. When personality scores are decorative, the cohort's qualitative feedback lacks behavioral realism.`;

  const oceanAlignmentAction = oceanAlignment.score >= 75
    ? "No action needed — this is working well"
    : "Vary the OCEAN values more drastically to enforce behavioral alignment";

  const distinctivenessVerdict = personaDistinctiveness.score >= 80
    ? "✓ Persona statements are structurally diverse and unique"
    : (personaDistinctiveness.score >= 50
      ? "~ Moderate structural mirroring detected"
      : "⚠ Personas sound too similar to each other");

  const distinctivenessExplanation = personaDistinctiveness.score >= 80
    ? `Feedback statements are highly varied in length, sentence structure, and vocabulary. Distinct writing styles suggest natural, human-like voice synthesis.`
    : `Most feedback follows the same structure: raise a concern, justify it, add a condition. Over half start with "I am" or "I am not." Different people speak differently.`;

  const distinctivenessAction = personaDistinctiveness.score >= 75
    ? "No action needed — this is working well"
    : "Vary communication styles more explicitly in your audience description";

  const dimsList = [
    {
      key: "score_variance",
      display_name: "Score spread",
      score: scoreVariance.score,
      status: getStatus(scoreVariance.score),
      verdict: scoreSpreadVerdict,
      explanation: scoreSpreadExplanation,
      action: scoreSpreadAction,
      icon: BarChart3,
    },
    {
      key: "ocean_alignment",
      display_name: "OCEAN alignment",
      score: oceanAlignment.score,
      status: getStatus(oceanAlignment.score),
      verdict: oceanAlignmentVerdict,
      explanation: oceanAlignmentExplanation,
      action: oceanAlignmentAction,
      icon: Fingerprint,
    },
    {
      key: "profile_coherence",
      display_name: "Profile coherence",
      score: profileCoherence.score,
      status: getStatus(profileCoherence.score),
      verdict: profileCoherenceVerdict,
      explanation: profileCoherenceExplanation,
      action: profileCoherenceAction,
      icon: CheckCircle2,
    },
    {
      key: "objection_diversity",
      display_name: "Objection diversity",
      score: objectionDiversity.score,
      status: getStatus(objectionDiversity.score),
      verdict: objectionDiversityVerdict,
      explanation: objectionDiversityExplanation,
      action: objectionDiversityAction,
      icon: RefreshCw,
    },
    {
      key: "persona_distinctiveness",
      display_name: "Persona distinctiveness",
      score: personaDistinctiveness.score,
      status: getStatus(personaDistinctiveness.score),
      verdict: distinctivenessVerdict,
      explanation: distinctivenessExplanation,
      action: distinctivenessAction,
      icon: Sparkles,
    },
  ];

  const overallLabel = labelMapping(rawFinalScore);
  const overallStatus = getStatus(rawFinalScore);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Premium Header Widget */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* Dynamic decorative backdrop radial gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Synthetic fidelity score
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              How realistically did the personas behave as distinct humans?
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-foreground tabular-nums tracking-tighter">
                {animatedScore}
              </span>
              <span className="text-muted-foreground font-semibold text-sm">/100</span>
            </div>
            
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBg(overallStatus)}`}>
              {overallLabel}
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${getBarBg(overallStatus)}`}
              style={{ width: `${animatedScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Structured Cards List */}
      <div className="space-y-4">
        {dimsList.map((dim, idx) => {
          const IconComponent = dim.icon;
          const statusColor = getStatusColor(dim.status);
          const isHigh = dim.score >= 75;

          return (
            <div 
              key={dim.key} 
              className="bg-card border border-border/60 rounded-xl p-5 hover:border-border transition-all duration-300 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6"
              style={{ 
                animation: `fadeIn 0.5s ease-out both`,
                animationDelay: `${idx * 100}ms`
              }}
            >
              {/* Left Column: Details */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground">
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {dim.display_name}
                  </h3>
                </div>

                <p className={`text-sm font-semibold flex items-center gap-1.5 ${statusColor}`}>
                  {dim.verdict}
                </p>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dim.explanation}
                </p>

                {/* Actionable Note */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  isHigh 
                    ? "bg-secondary/20 border-border/40 text-muted-foreground" 
                    : "bg-amber-500/5 border-amber-500/10 text-amber-500"
                }`}>
                  {isHigh ? (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                  )}
                  <span>{dim.action}</span>
                </div>
              </div>

              {/* Right Column: Score Graph */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 w-full md:w-28 border-t md:border-t-0 pt-3 md:pt-0 border-border/30">
                <span className="text-xs text-muted-foreground font-semibold md:hidden">Score</span>
                
                <div className="flex flex-col items-end gap-1 w-24">
                  <span className={`text-2xl font-black tabular-nums ${statusColor}`}>
                    {dim.score}
                  </span>
                  
                  {/* Micro mini-progress bar */}
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getBarBg(dim.status)}`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cohort Size Warning Box at Bottom */}
      {cohortSize < 10 && (
        <div className="bg-secondary/20 border border-border/40 rounded-xl p-4.5 flex gap-3 shadow-inner">
          <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Cohort size was <span className="font-semibold text-foreground">{cohortSize}</span>. Scores for spread and diversity are harder to achieve below 10 personas — some of this penalty is statistical, not a quality issue. Try <span className="font-semibold text-foreground">10+</span> for a more accurate reading.
          </p>
        </div>
      )}
    </div>
  );
}
