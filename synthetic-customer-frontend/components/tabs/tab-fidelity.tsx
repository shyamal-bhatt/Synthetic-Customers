"use client";

import { useState, useEffect } from "react";
import { CheckCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BenchmarkMetric {
  metric: string;
  synthetic: number;
  realWorld: number;
  mae: number;
  trend: "up" | "down" | "neutral";
}

const benchmarkData: BenchmarkMetric[] = [
  { metric: "Purchase Intent (1-10)", synthetic: 6.8, realWorld: 6.5, mae: 0.3, trend: "up" },
  { metric: "Price Sensitivity Index", synthetic: 7.2, realWorld: 7.4, mae: 0.2, trend: "neutral" },
  { metric: "Feature Importance Score", synthetic: 8.1, realWorld: 7.9, mae: 0.2, trend: "up" },
  { metric: "Brand Trust Rating", synthetic: 5.9, realWorld: 6.2, mae: 0.3, trend: "down" },
  { metric: "Adoption Likelihood", synthetic: 6.4, realWorld: 6.1, mae: 0.3, trend: "up" },
  { metric: "Churn Risk Factor", synthetic: 3.2, realWorld: 3.5, mae: 0.3, trend: "down" },
  { metric: "NPS Prediction", synthetic: 42, realWorld: 45, mae: 3.0, trend: "neutral" },
  { metric: "Willingness to Recommend", synthetic: 7.1, realWorld: 6.9, mae: 0.2, trend: "up" },
];

export function TabFidelity() {
  const [fidelityScore, setFidelityScore] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const targetScore = 92;

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = targetScore / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setFidelityScore(Math.min(Math.round(increment * currentStep), targetScore));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setShowDetails(true);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (fidelityScore / 100) * circumference;

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "neutral" }) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-rose-600" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-8">
      {/* Fidelity Score Circle */}
      <div className="flex justify-center">
        <div className="bg-card border border-border rounded-2xl p-10 inline-block">
          <div className="relative w-64 h-64">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-foreground transition-all duration-100"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold text-foreground tabular-nums">
                {fidelityScore}%
              </span>
              <span className="text-sm text-muted-foreground mt-2">
                Fidelity Index
              </span>
            </div>
          </div>

          {/* Status indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">High Confidence</span>
          </div>
        </div>
      </div>

      {/* Benchmark Table */}
      <div
        className={`bg-card border border-border rounded-xl overflow-hidden transition-all duration-500 ${
          showDetails ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-muted/50 border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground">
            Synthetic vs. Real-World Benchmark Comparison
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Mean Absolute Error (MAE) scoring against validated human benchmark datasets
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                  Metric
                </th>
                <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">
                  Synthetic Cohort
                </th>
                <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">
                  Real-World Benchmark
                </th>
                <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">
                  MAE Distance
                </th>
                <th className="text-center text-sm font-medium text-muted-foreground px-6 py-4">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData.map((row, index) => (
                <tr
                  key={row.metric}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    {row.metric}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground text-right tabular-nums">
                    {row.synthetic.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground text-right tabular-nums">
                    {row.realWorld.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium tabular-nums ${
                        row.mae <= 0.2
                          ? "bg-emerald-50 text-emerald-700"
                          : row.mae <= 0.4
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      ±{row.mae.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <TrendIcon trend={row.trend} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="bg-muted/30 border-t border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Average MAE across all metrics: <span className="font-medium text-foreground">0.48</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Benchmark dataset: <span className="font-medium text-foreground">n=2,847 validated respondents</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
