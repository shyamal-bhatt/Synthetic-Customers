"use client";

import { useState, useRef, useEffect } from "react";
import { FolderOpen, Trash2, ChevronDown, Clock, Lightbulb, UserCheck, ShieldCheck } from "lucide-react";
import type { SavedStudy } from "@/app/page";

interface WorkedIdeasDropdownProps {
  studies: SavedStudy[];
  activeStudyId: string | null;
  onLoadStudy: (study: SavedStudy) => void;
  onDeleteStudy: (studyId: string) => void;
}

const getColor = (id: string) => {
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const ZooZooAvatar = ({ color }: { color: string }) => (
  <svg viewBox="0 0 40 40" className="w-8 h-8 shrink-0 overflow-visible">
    <ellipse cx="20" cy="30" rx="10" ry="14" fill="#f2f2f2" stroke="#d5d5d5" strokeWidth="1" />
    <circle cx="20" cy="14" r="12" fill="#f5f5f5" stroke="#ddd" strokeWidth="1" />
    {/* Body Tint */}
    <ellipse cx="20" cy="30" rx="10" ry="14" fill={color} opacity="0.15" />
    <circle cx="20" cy="14" r="12" fill={color} opacity="0.1" />
    
    <ellipse cx="16" cy="13" rx="1.5" ry="2" fill="#111" />
    <ellipse cx="24" cy="13" rx="1.5" ry="2" fill="#111" />
    <path d="M16 18 Q20 20 24 18" fill="none" stroke="#111" strokeWidth="1" strokeLinecap="round" />
    
    <path d="M10 24 Q4 30 6 36" fill="none" stroke="#d8d8d8" strokeWidth="4" strokeLinecap="round" />
    {/* Right Arm (Waving on hover) */}
    <path 
      className="origin-[30px_24px] group-hover:animate-[wave_0.5s_ease-in-out_infinite]"
      d="M30 24 Q36 30 34 36" 
      fill="none" 
      stroke="#d8d8d8" 
      strokeWidth="4" 
      strokeLinecap="round" 
    />
  </svg>
);

export function WorkedIdeasDropdown({
  studies,
  activeStudyId,
  onLoadStudy,
  onDeleteStudy,
}: WorkedIdeasDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatDate = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background/50 hover:bg-muted text-sm font-semibold text-foreground transition-all duration-200 shadow-sm"
        >
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
          <span>Worked Ideas</span>
          {studies.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
              {studies.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-96 rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-border/60">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Research History
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Access or manage your previous customer research studies.
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {studies.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs font-medium space-y-2">
                <Lightbulb className="w-6 h-6 mx-auto text-muted-foreground/35" />
                <p>No previous studies found.</p>
                <p className="text-[10px] text-muted-foreground/60 max-w-[200px] mx-auto">
                  Initialize a new study configuration to get started!
                </p>
              </div>
            ) : (
              [...studies]
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((study) => {
                  const isActive = study.studyId === activeStudyId;
                  const hasPersonas = study.personas && study.personas.length > 0;
                  const hasFeedback = study.feedbacks && study.feedbacks.length > 0;

                  return (
                    <div
                      key={study.studyId}
                      className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                        isActive
                          ? "bg-foreground/5 border-foreground/30 text-foreground"
                          : "bg-transparent border-transparent hover:bg-muted hover:border-border/50 text-muted-foreground"
                      }`}
                    >
                      <button
                        onClick={() => {
                          onLoadStudy(study);
                          setIsOpen(false);
                        }}
                        className="flex-1 flex items-center gap-3 text-left min-w-0 pr-2 cursor-pointer"
                      >
                        <ZooZooAvatar color={getColor(study.studyId)} />
                        
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-semibold text-xs text-foreground truncate pr-6 group-hover:text-foreground/95 transition-colors">
                            {study.config.projectName || study.config.productIdea}
                          </span>
                        
                        <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {study.config.targetAudience}
                        </span>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground/65" />
                            {formatDate(study.timestamp)}
                          </span>

                          <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider border flex items-center gap-1 ${
                            hasFeedback
                              ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/15"
                              : hasPersonas
                              ? "bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/15"
                              : "bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/15"
                          }`}>
                            {hasFeedback ? (
                              <>
                                <ShieldCheck className="w-3 h-3 shrink-0" />
                                Analyzed
                              </>
                            ) : hasPersonas ? (
                              <>
                                <UserCheck className="w-3 h-3 shrink-0" />
                                Cohort Ready
                              </>
                            ) : (
                              "In Refinement"
                            )}
                          </span>
                        </div>
                       </div>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStudy(study.studyId);
                        }}
                        className="p-1.5 rounded-lg border border-transparent text-muted-foreground/45 hover:text-rose-600 hover:bg-rose-500/5 hover:border-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0"
                        title="Delete Study"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
