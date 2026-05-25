"use client";

import { useEffect, useState } from "react";
import { Info, ChevronRight } from "lucide-react";

export interface FidelityMeterProps {
  total_score?: number; // integer 0-100
  total_label?: string; // string (e.g. "Good fidelity")
  total_status?: "high" | "mid" | "low"; // semantic status
  weakest_dimension?: {
    display_name: string;
    explanation: string;
  } | null;
  cohort_size_note?: string | null;
  onViewFidelity?: () => void;
}

export function FidelityMeter({
  total_score = 0,
  total_label = "Unreliable",
  total_status = "low",
  weakest_dimension = null,
  cohort_size_note = null,
  onViewFidelity,
}: FidelityMeterProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Triggers ease-in transition on initial mount
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Helper to trim the dimension explanation to the first sentence only
  const getFirstSentence = (text?: string): string => {
    if (!text) return "";
    // Match first sequence of characters ending with terminal punctuation (. ? !) followed by whitespace or end of line.
    const match = text.match(/^[^.!?]+[.!?]/);
    if (match) {
      return match[0].trim();
    }
    return text.trim();
  };

  const badgeStyles = {
    high: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    mid: "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400",
    low: "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400",
  };

  const fillStyles = {
    high: "bg-emerald-500",
    mid: "bg-amber-500",
    low: "bg-rose-500",
  };

  const descriptionMapping = {
    high: "Personas behaved as distinct, realistic humans. These results are directional and trustworthy.",
    mid: "Most personas behaved realistically with some uniformity. Treat these results as directional — validate key findings with real users.",
    low: "Significant uniformity was detected across personas. Use these results to generate hypotheses only — do not act on them without real user validation.",
  };

  const trustDescription = descriptionMapping[total_status] || "";

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
      {/* Decorative premium corner accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* 1. HEADER ROW */}
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-foreground text-sm tracking-tight">
          Research quality
        </span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            badgeStyles[total_status] || badgeStyles.low
          }`}
        >
          {total_label}
        </span>
      </div>

      {/* 2. METER BAR */}
      <div className="mt-3.5">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-[350ms] ease-out ${
              fillStyles[total_status] || fillStyles.low
            }`}
            style={{ width: `${isMounted ? total_score : 0}%` }}
          />
        </div>
      </div>

      {/* 3. PLAIN ENGLISH DESCRIPTION */}
      <p className="text-xs md:text-sm text-muted-foreground mt-3 leading-relaxed font-medium">
        {trustDescription}
      </p>

      {/* 4. WEAKEST SIGNAL CALLOUT */}
      {total_score < 90 && weakest_dimension && (
        <div className="border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 p-4 rounded-r-xl mt-5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
            Weakest signal
          </span>
          <span className="block font-semibold text-foreground text-sm mt-0.5">
            {weakest_dimension.display_name}
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            → {getFirstSentence(weakest_dimension.explanation)}
          </p>
        </div>
      )}

      {/* 5. COHORT SIZE NOTE */}
      {cohort_size_note && (
        <div className="mt-5 pt-4 border-t border-border/40 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {cohort_size_note}
          </p>
        </div>
      )}

      {/* 6. CONNECTING TO FIDELITY TABLE */}
      {onViewFidelity && (
        <div className="mt-4 pt-1.5 flex justify-start">
          <button
            onClick={onViewFidelity}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group/btn"
          >
            <span>See full breakdown</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      )}
    </div>
  );
}
