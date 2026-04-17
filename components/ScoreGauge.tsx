"use client";

import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  animate?: boolean;
}

export default function ScoreGauge({ score, size = 200, animate = true }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }
    let current = 0;
    const step = Math.max(1, Math.floor(score / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(current);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [score, animate]);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  const color =
    displayScore >= 70
      ? "#22c55e"
      : displayScore >= 40
        ? "#eab308"
        : "#ef4444";

  const label =
    displayScore >= 80
      ? "Excellent"
      : displayScore >= 60
        ? "Good"
        : displayScore >= 40
          ? "Needs Work"
          : "Poor";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-100"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-5xl font-bold" style={{ color }}>
          {displayScore}
        </span>
        <span className="text-sm font-medium text-gray-500 mt-1">{label}</span>
      </div>
    </div>
  );
}
