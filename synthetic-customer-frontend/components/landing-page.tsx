"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Zap, Users, Target } from "lucide-react";
import type { StudyConfig } from "@/app/page";

interface LandingPageProps {
  onInitialize: (config: StudyConfig) => void;
  isInitializing?: boolean;
}

export function LandingPage({ onInitialize, isInitializing = false }: LandingPageProps) {
  const [productIdea, setProductIdea] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [cohortSize, setCohortSize] = useState(20);

  const handleSubmit = () => {
    if (productIdea.trim() && targetAudience.trim() && !isInitializing) {
      onInitialize({ productIdea, targetAudience, cohortSize });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Synthetic Customer
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Docs
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm mb-6">
            <Zap className="w-3 h-3" />
            AI-Powered Product Testing
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
            Test any product idea in 5 minutes
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
              {/* Product Idea Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Product Idea & Problem Statement
                </label>
                <Textarea
                  placeholder="An AI app that builds a weekly grocery list from a photo of your fridge..."
                  className="min-h-[140px] resize-none bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
                  value={productIdea}
                  onChange={(e) => setProductIdea(e.target.value)}
                  disabled={isInitializing}
                />
              </div>

              {/* Target Audience Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Target Audience & Market
                </label>
                <Input
                  placeholder="Busy professionals aged 25-45 who want to eat healthier"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  disabled={isInitializing}
                />
              </div>

              {/* Cohort Size Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Cohort Size
                </label>
                <div className="flex gap-3">
                  {[10, 20, 50, 100].map((size) => (
                    <button
                      key={size}
                      onClick={() => setCohortSize(size)}
                      disabled={isInitializing}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                        cohortSize === size
                          ? "bg-foreground text-background shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {size} personas
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!productIdea.trim() || !targetAudience.trim() || isInitializing}
                  className="w-full h-14 text-base font-medium rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isInitializing ? (
                    <>
                      <span className="w-5 h-5 mr-3 border-2 border-background border-t-transparent rounded-full animate-spin"></span>
                      Initializing Framework...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Initialize Study Framework
                    </>
                  )}
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
