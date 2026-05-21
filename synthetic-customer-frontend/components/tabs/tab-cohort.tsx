"use client";

import { useState, useEffect, useMemo } from "react";
import { X, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";

interface Persona {
  id: number;
  name: string;
  age: number;
  occupation: string;
  income: string;
  techSavviness: number;
  ocean: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  interview: string;
  mustHave: string[];
  useless: string[];
  objections: string[];
}

const firstNames = [
  "Sarah", "Michael", "Emma", "James", "Olivia", "William", "Ava", "Benjamin",
  "Sophia", "Lucas", "Mia", "Henry", "Charlotte", "Alexander", "Amelia", "Daniel",
  "Harper", "Matthew", "Evelyn", "David", "Abigail", "Joseph", "Emily", "Samuel",
  "Elizabeth", "Sebastian", "Sofia", "Jack", "Avery", "Aiden", "Ella", "Owen",
];

const lastNames = [
  "Chen", "Martinez", "Patel", "Johnson", "Williams", "Brown", "Kim", "Singh",
  "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "White", "Harris", "Martin",
  "Thompson", "Garcia", "Robinson", "Clark", "Lewis", "Lee", "Walker", "Hall",
];

const occupations = [
  "Product Manager", "Software Engineer", "Marketing Director", "Entrepreneur",
  "UX Designer", "Data Analyst", "Consultant", "Healthcare Professional",
  "Financial Analyst", "Teacher", "Creative Director", "Operations Manager",
  "Sales Executive", "Research Scientist", "Freelancer", "Business Owner",
];

const incomes = [
  "$40K-60K", "$60K-80K", "$80K-100K", "$100K-150K", "$150K-200K", "$200K+",
];

const interviews = [
  "I'm always looking for tools that save me time. If this can genuinely reduce my weekly planning by even 30 minutes, I'd pay for it without thinking twice.",
  "Honestly, I'm skeptical of AI products. I've been burned before by overpromising tech. Show me it works with real examples and I'll consider it.",
  "Price is secondary to me if the value is there. What matters most is whether it integrates well with my existing workflow.",
  "I'd need to try it for at least a month before committing. A good free trial is essential for products like this.",
  "My main concern is data privacy. If you can guarantee my information is secure and not used for training, I'm in.",
  "I love trying new productivity tools. I'm probably not your typical user though - I'll want advanced features quickly.",
];

const mustHaves = [
  "Easy onboarding", "Mobile app", "Dark mode", "Offline access", "API access",
  "Team collaboration", "Data export", "Custom reports", "Integrations",
  "Real-time sync", "Email notifications", "Calendar integration",
];

const uselessFeatures = [
  "Gamification", "Social sharing", "Achievement badges", "Leaderboards",
  "Animated tutorials", "AI chatbot support", "Community forums", "Newsletter",
];

const objectionsList = [
  "The pricing seems high for individual users",
  "I'm not sure I trust AI with this kind of decision",
  "How is this different from existing solutions?",
  "I'd need team features before this is useful",
  "The learning curve looks steep",
  "I'm concerned about vendor lock-in",
  "What happens to my data if you shut down?",
  "I need to see more social proof first",
];

function generatePersona(id: number): Persona {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return {
    id,
    name: `${firstName} ${lastName}`,
    age: Math.floor(Math.random() * 30) + 25,
    occupation: occupations[Math.floor(Math.random() * occupations.length)],
    income: incomes[Math.floor(Math.random() * incomes.length)],
    techSavviness: Math.floor(Math.random() * 10) + 1,
    ocean: {
      openness: Math.floor(Math.random() * 10) + 1,
      conscientiousness: Math.floor(Math.random() * 10) + 1,
      extraversion: Math.floor(Math.random() * 10) + 1,
      agreeableness: Math.floor(Math.random() * 10) + 1,
      neuroticism: Math.floor(Math.random() * 10) + 1,
    },
    interview: interviews[Math.floor(Math.random() * interviews.length)],
    mustHave: mustHaves.sort(() => Math.random() - 0.5).slice(0, 3),
    useless: uselessFeatures.sort(() => Math.random() - 0.5).slice(0, 2),
    objections: objectionsList.sort(() => Math.random() - 0.5).slice(0, 2),
  };
}

interface TabCohortProps {
  cohortSize: number;
}

export function TabCohort({ cohortSize }: TabCohortProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  const personas = useMemo(() => {
    return Array.from({ length: cohortSize }, (_, i) => generatePersona(i + 1));
  }, [cohortSize]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= cohortSize) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [cohortSize]);

  const OceanBar = ({ value, label }: { value: number; label: string }) => (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground rounded-full transition-all duration-500"
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="text-xs font-medium text-foreground w-4">{value}</span>
    </div>
  );

  return (
    <div className="relative">
      {/* Persona Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {personas.slice(0, visibleCount).map((persona, index) => (
          <button
            key={persona.id}
            onClick={() => setSelectedPersona(persona)}
            className="bg-card border border-border rounded-xl p-5 text-left hover:border-foreground/30 hover:shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 20}ms` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-sm">
                {persona.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {persona.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {persona.age} years old
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              {persona.occupation}
            </p>
            <p className="text-xs text-muted-foreground mb-4">{persona.income}</p>
            
            {/* Mini OCEAN preview */}
            <div className="space-y-1">
              {Object.entries(persona.ocean).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground/60 rounded-full"
                      style={{ width: `${value * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Detail Panel */}
      {selectedPersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-lg">
                  {selectedPersona.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {selectedPersona.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPersona.age} • {selectedPersona.occupation} • {selectedPersona.income}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPersona(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* OCEAN Profile */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-4">
                  OCEAN Psychological Profile
                </h4>
                <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                  <OceanBar value={selectedPersona.ocean.openness} label="Openness" />
                  <OceanBar value={selectedPersona.ocean.conscientiousness} label="Conscientiousness" />
                  <OceanBar value={selectedPersona.ocean.extraversion} label="Extraversion" />
                  <OceanBar value={selectedPersona.ocean.agreeableness} label="Agreeableness" />
                  <OceanBar value={selectedPersona.ocean.neuroticism} label="Neuroticism" />
                </div>
              </div>

              {/* Interview Response */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">
                  Open Interview Response
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed bg-muted/50 rounded-xl p-4">
                  &ldquo;{selectedPersona.interview}&rdquo;
                </p>
              </div>

              {/* Feature Rankings */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    Must-Have Features
                  </h4>
                  <ul className="space-y-2">
                    {selectedPersona.mustHave.map((feature) => (
                      <li
                        key={feature}
                        className="text-sm text-muted-foreground bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-rose-600" />
                    Useless Features
                  </h4>
                  <ul className="space-y-2">
                    {selectedPersona.useless.map((feature) => (
                      <li
                        key={feature}
                        className="text-sm text-muted-foreground bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Objections */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Top Objections
                </h4>
                <ul className="space-y-2">
                  {selectedPersona.objections.map((objection, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg"
                    >
                      {objection}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
