"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  DollarSign,
  Clock,
  RotateCcw,
  Lightbulb,
  Route,
  Users,
  MessageCircle,
  Target,
} from "lucide-react";
import type { StudyConfig, MCQAnswers, StudyMCQSchema } from "@/app/page";
import { TabIdea } from "@/components/tabs/tab-idea";
import { TabJourney } from "@/components/tabs/tab-journey";
import { TabCohort } from "@/components/tabs/tab-cohort";
import { TabFocusGroup } from "@/components/tabs/tab-focus-group";
import { TabFidelity } from "@/components/tabs/tab-fidelity";

interface DashboardProps {
  config: StudyConfig;
  mcqForm: StudyMCQSchema;
  mcqAnswers: MCQAnswers;
  onReset: () => void;
}

export function Dashboard({ config, mcqForm, mcqAnswers, onReset }: DashboardProps) {
  const [moneySaved, setMoneySaved] = useState(0);
  const [timeSaved, setTimeSaved] = useState(0);
  const [activeTab, setActiveTab] = useState("idea");

  // Animate value counters
  useEffect(() => {
    const moneyTarget = 12500;
    const timeTarget = 4;
    const duration = 2000;
    const steps = 60;
    const moneyIncrement = moneyTarget / steps;
    const timeIncrement = timeTarget / steps;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setMoneySaved(Math.min(Math.round(moneyIncrement * currentStep), moneyTarget));
      setTimeSaved(Math.min(parseFloat((timeIncrement * currentStep).toFixed(1)), timeTarget));
      
      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: "idea", label: "The Idea", icon: Lightbulb },
    { id: "journey", label: "Your Journey", icon: Route },
    { id: "cohort", label: "The Cohort", icon: Users },
    { id: "focus-group", label: "Live Focus Group", icon: MessageCircle },
    { id: "fidelity", label: "Fidelity Score", icon: Target },
  ];

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
              Synthetic Customer
            </span>
          </div>

          {/* Value Counter */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-muted-foreground">Money Saved:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  ${moneySaved.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-muted-foreground">Time Saved:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {timeSaved} Weeks
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Study
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-6">
            <TabsList className="h-14 bg-transparent p-0 gap-0 w-full justify-start rounded-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="h-14 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground transition-all"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <TabsContent value="idea" className="mt-0">
            <TabIdea config={config} mcqForm={mcqForm} mcqAnswers={mcqAnswers} />
          </TabsContent>
          <TabsContent value="journey" className="mt-0">
            <TabJourney />
          </TabsContent>
          <TabsContent value="cohort" className="mt-0">
            <TabCohort cohortSize={config.cohortSize} />
          </TabsContent>
          <TabsContent value="focus-group" className="mt-0">
            <TabFocusGroup />
          </TabsContent>
          <TabsContent value="fidelity" className="mt-0">
            <TabFidelity />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
