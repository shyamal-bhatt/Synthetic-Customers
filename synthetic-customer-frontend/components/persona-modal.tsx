import { X, ThumbsUp, ThumbsDown, AlertTriangle, TrendingUp, Brain, Shield, Briefcase, PiggyBank, CheckCircle, HelpCircle, MessageSquare } from "lucide-react";
import type { Persona, PersonaFeedback } from "@/components/dashboard";
import { useMemo, useState } from "react";
import { PersonaZooZoo } from "./ui/persona-zoozoo";
import { PersonaChat } from "./persona-chat";

interface PersonaModalProps {
  selectedPersona: Persona | null;
  setSelectedPersona: (persona: Persona | null) => void;
  feedback: PersonaFeedback[];
  activeStudyId: string | null;
}

export function PersonaModal({ selectedPersona, setSelectedPersona, feedback, activeStudyId }: PersonaModalProps) {
  const activeFeedback = useMemo(() => {
    if (!selectedPersona) return null;
    return feedback.find((f) => f.personaId === selectedPersona.id) || null;
  }, [selectedPersona, feedback]);

  const [showTranscript, setShowTranscript] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "interview">("profile");

  if (!selectedPersona) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 shrink-0 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden relative">
              <PersonaZooZoo 
                incomeBracket={selectedPersona.incomeBracket} 
                activity="idle"
                variant="headshot"
                lookAtCursor={true}
                className="w-full h-full"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                {selectedPersona.name || "Generating..."}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                {selectedPersona.age || "--"} • {selectedPersona.occupation || ""} • {selectedPersona.location || "Unknown"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className={`p-2 rounded-lg transition-colors shadow-sm ${activeTab === "interview" ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-muted/80"}`}
              onClick={() => setActiveTab("interview")}
              title="Chat 1-on-1"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedPersona(null)}
              className="p-2 rounded-lg hover:bg-muted transition-colors border border-border/40"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 px-6 pt-4 border-b border-border">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === "profile" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
          >
            Profile & Feedback
            {activeTab === "profile" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab("interview")}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === "interview" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
          >
            1-on-1 Interview
            {activeTab === "interview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {activeTab === "interview" ? (
            <PersonaChat personaId={selectedPersona.id} studyId={activeStudyId || ""} personaName={selectedPersona.name} />
          ) : (
            <>
              {/* Simulation Response Meta */}
              {activeFeedback && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border/80 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                  Purchase Intent
                </p>
                <div className="text-amber-500 text-xs font-bold justify-center flex gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span 
                      key={i} 
                      className={i < activeFeedback.likelihoodToBuy ? "text-amber-500" : "text-muted-foreground/30"}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-card border border-border/80 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                  Price Reaction
                </p>
                <span className={`text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                  activeFeedback.priceReaction === "too_cheap" ? "bg-blue-500/10 text-blue-500" :
                  activeFeedback.priceReaction === "acceptable" ? "bg-emerald-500/10 text-emerald-500" :
                  activeFeedback.priceReaction === "expensive" ? "bg-amber-500/10 text-amber-500" :
                  "bg-rose-500/10 text-rose-500"
                }`}>
                  {activeFeedback.priceReaction.replace("_", " ")}
                </span>
              </div>
              <div className="bg-card border border-border/80 rounded-xl p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                  Trial Conversion
                </p>
                <span className={`text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                  activeFeedback.wouldTryFreeTrial ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                }`}>
                  {activeFeedback.wouldTryFreeTrial ? "High (Yes)" : "Low (No)"}
                </span>
              </div>
            </div>
          )}

          {/* Persona Context Card Details */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-500" />
              Demographic & Behavioral Foundation
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 border border-border/50 rounded-xl p-5 text-sm">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <Briefcase className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Income bracket</p>
                    <p className="font-semibold text-foreground">{selectedPersona.incomeBracket}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Tech Savviness</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-3 h-1.5 rounded-sm ${i < selectedPersona.techSavviness ? "bg-foreground" : "bg-muted"}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Trust style</p>
                    <p className="font-medium text-foreground/80">{selectedPersona.trustStyle}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Current Solution</p>
                    <p className="font-medium text-foreground/80">{selectedPersona.currentSolution}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <PiggyBank className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Relationship with Money</p>
                    <p className="font-medium text-foreground/80">{selectedPersona.relationshipWithMoney}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Professional Frustration</p>
                    <p className="font-medium text-foreground/80 truncate max-w-[240px]" title={selectedPersona.biggestProfessionalFrustration}>
                      {selectedPersona.biggestProfessionalFrustration}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progressive reveals for Psychological details */}
          {activeFeedback ? (
            <>
              {/* OCEAN Profile */}
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-500" />
                  OCEAN Psychological Profile
                </h4>
                <div className="space-y-3 bg-muted/30 border border-border/50 rounded-xl p-5">
                  <OceanBar value={selectedPersona.oceanProfile.openness} label="Openness" />
                  <OceanBar value={selectedPersona.oceanProfile.conscientiousness} label="Conscientiousness" />
                  <OceanBar value={selectedPersona.oceanProfile.extraversion} label="Extraversion" />
                  <OceanBar value={selectedPersona.oceanProfile.agreeableness} label="Agreeableness" />
                  <OceanBar value={selectedPersona.oceanProfile.neuroticism} label="Neuroticism" />
                  <div className="pt-3 border-t border-border/40 mt-3 text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground/80">Profile Core: </span>
                    {selectedPersona.oceanProfile.profileSummary}
                  </div>
                </div>
              </div>

              {/* Interview Response & Transcript */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">
                    Open Interview Response
                  </h4>
                  {activeFeedback.mcqTranscript && activeFeedback.mcqTranscript.length > 0 && (
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="text-xs font-semibold text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {showTranscript ? "Hide MCQ Transcript" : "View MCQ Transcript"}
                    </button>
                  )}
                </div>
                
                {!showTranscript ? (
                  <p className="text-foreground/90 text-sm leading-relaxed bg-muted/30 border border-border/50 rounded-xl p-5 font-medium italic">
                    &ldquo;{activeFeedback.overallStatement}&rdquo;
                  </p>
                ) : (
                  <div className="space-y-4 bg-muted/30 border border-border/50 rounded-xl p-5">
                    {activeFeedback.mcqTranscript.map((item, idx) => (
                      <div key={idx} className="bg-card border border-border/80 rounded-lg p-4">
                        <div className="mb-2 pb-2 border-b border-border/50">
                          <p className="text-xs font-bold text-foreground mb-1">
                            Q{idx + 1}: {item.question}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {item.options.map((opt, oIdx) => (
                              <span key={oIdx} className={`text-[10px] px-2 py-0.5 rounded-full border ${opt === item.selectedOption ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-bold" : "bg-muted text-muted-foreground border-border"}`}>
                                {opt}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            <span className="font-semibold text-foreground/80">Owner selected:</span> {item.selectedOption}
                          </p>
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed font-medium italic">
                          <span className="font-bold text-violet-500 not-italic uppercase text-[10px] tracking-wider block mb-1">Persona's Response:</span>
                          &ldquo;{item.personaResponse}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Feature Rankings */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-500" />
                    Must-Have Features
                  </h4>
                  <ul className="space-y-2">
                    {activeFeedback.featuresShouldHave.map((feature, i) => (
                      <li
                        key={i}
                        className="text-xs text-foreground/85 bg-emerald-500/5 border border-emerald-500/10 px-3.5 py-2 rounded-lg font-medium"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-rose-500" />
                    Useless Features
                  </h4>
                  <ul className="space-y-2">
                    {activeFeedback.featuresShouldNotHave.map((feature, i) => (
                      <li
                        key={i}
                        className="text-xs text-foreground/85 bg-rose-500/5 border border-rose-500/10 px-3.5 py-2 rounded-lg font-medium"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Objections */}
              {activeFeedback.topObjections && activeFeedback.topObjections.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Simulated Objections & Friction
                  </h4>
                  <div className="space-y-3">
                    {activeFeedback.topObjections.map((obj, i) => (
                      <div key={i} className="bg-card border border-border/80 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
                        <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-amber-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-xs font-semibold text-foreground leading-relaxed">{obj.objection}</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                            obj.severity === "critical" ? "bg-rose-500/10 text-rose-500" :
                            obj.severity === "moderate" ? "bg-amber-500/10 text-amber-500" :
                            "bg-blue-500/10 text-blue-500"
                          }`}>
                            {obj.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-6.5">
                          <span className="font-bold text-foreground/85">Overcome if: </span>
                          {obj.wouldOvercomeIf}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dealbreaker & Awareness Shift */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1.5">
                    Absolute Dealbreaker
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    {selectedPersona.dealbreaker}
                  </p>
                </div>
                <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
                  <h4 className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1.5">
                    Awareness Shift
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                    {activeFeedback.awarenessShift}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Locked Profile Feedback state indicator */
            <div className="border border-dashed border-border/80 rounded-xl p-8 text-center bg-muted/10 animate-in fade-in duration-300 space-y-2">
              <Brain className="w-8 h-8 mx-auto text-muted-foreground/40 animate-pulse" />
              <p className="text-sm font-bold text-foreground/80">Psychological Profile & Feedback Locked</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Simulated interview feedbacks, Must-Have integrations, objections, and OCEAN dimensions are currently locked. Deploy the research simulation thread below the grid to compile full profile reports.
              </p>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
