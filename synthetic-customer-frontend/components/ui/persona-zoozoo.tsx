"use client";
import React, { useEffect, useRef } from "react";

interface PersonaZooZooProps {
  incomeBracket?: string;
  className?: string;
  isAlerted?: boolean;
  activity?: 'idle' | 'pacer' | 'kicker' | 'bouncer' | 'greeter';
  variant?: 'full' | 'headshot';
  lookAtCursor?: boolean;
  onClick?: () => void;
}

export function PersonaZooZoo({ incomeBracket = "LOW", className = "", isAlerted = false, activity = 'idle', variant = 'full', lookAtCursor = false, onClick }: PersonaZooZooProps) {
  // Determine color based on income bracket
  let color = "#64748b"; // default neutral
  let bodyColor = "#f2f2f2"; // default neutral body

  const upper = incomeBracket.toUpperCase();
  if (upper.includes("HIGH")) {
    color = "#eab308"; // warm tone (yellow/orange)
    bodyColor = "#fef3c7";
  } else if (upper.includes("MID")) {
    color = "#3b82f6"; // cool tone (blue)
    bodyColor = "#dbeafe";
  } else {
    color = "#a855f7"; // neutral/low (purple)
    bodyColor = "#f3e8ff";
  }

  const svgRef = useRef<SVGSVGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!lookAtCursor) return;

    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      const angle = Math.atan2(deltaY, deltaX);
      const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 60, 2.0); 
      
      targetX = Math.cos(angle) * distance;
      targetY = Math.sin(angle) * distance;
    };

    const animate = () => {
      // Smooth interpolation (lerp)
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      
      if (eyesRef.current) {
        eyesRef.current.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animate();
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [lookAtCursor]);

  return (
    <div 
      className={`group relative cursor-pointer flex items-center justify-center ${className} ${activity === 'pacer' ? 'animate-[pace_8s_ease-in-out_infinite]' : ''}`}
      onClick={onClick}
    >
      <svg 
        ref={svgRef}
        viewBox={variant === 'headshot' ? "0 0 40 40" : "-10 0 60 70"} 
        className={`${variant === 'headshot' ? 'w-full h-full' : 'w-14 h-16'} shrink-0 overflow-visible ${activity === 'idle' ? 'animate-[avatar-bob_3s_ease-in-out_infinite]' : ''}`}
      >
        {/* Legs */}
        <g stroke="#d8d8d8" strokeWidth="5" strokeLinecap="round" fill="none">
          <path 
            d="M 14 50 L 14 62" 
            className={`${activity === 'kicker' ? 'animate-[leg-swing-left_1.5s_ease-in-out_infinite_alternate] origin-[14px_50px]' : ''}`} 
          />
          <path 
            d="M 26 50 L 26 62" 
            className={`${activity === 'kicker' ? 'animate-[leg-swing-right_1.5s_ease-in-out_infinite_alternate-reverse] origin-[26px_50px]' : ''}`} 
          />
        </g>

        {/* Arms */}
        <g stroke="#d8d8d8" strokeWidth="5" strokeLinecap="round" fill="none">
          {/* Left Arm */}
          <path 
            d="M 6 30 Q 0 40 4 48" 
            className={`${activity === 'greeter' && !isAlerted ? 'animate-[continuous-wave_1.2s_ease-in-out_infinite] origin-[6px_30px]' : ''}`}
          />
          {/* Right Arm */}
          <path d="M 34 30 Q 40 40 36 48" />
        </g>

        {/* Body Bean Shape */}
        <ellipse cx="20" cy="35" rx="14" ry="18" fill={bodyColor} stroke="#d5d5d5" strokeWidth="1.5" />

        {/* Head Base */}
        <circle cx="20" cy="18" r="14" fill="#f5f5f5" stroke="#ddd" strokeWidth="1.5" />
        
        {/* Colorful gradient behind the face to match original design */}
        <circle cx="20" cy="18" r="12" fill={color} opacity="0.15" />
        
        {/* Moving Eyes Group */}
        <g ref={eyesRef}>
          {/* Eyes (widen when alerted) */}
          <ellipse cx="15.5" cy="16" rx={isAlerted ? "2.5" : "1.5"} ry={isAlerted ? "3" : "2"} fill="#111" className="group-hover:scale-y-[0.2] transition-all origin-[15.5px_16px]" />
          <ellipse cx="24.5" cy="16" rx={isAlerted ? "2.5" : "1.5"} ry={isAlerted ? "3" : "2"} fill="#111" className="group-hover:scale-y-[0.2] transition-all origin-[24.5px_16px]" />
          
          {/* Specular Dots (disappear when alerted or hovered to simulate blinking/wide eyes) */}
          <g className="group-hover:opacity-0 transition-opacity">
            <circle cx="16" cy="15" r="0.6" fill="white" />
            <circle cx="25" cy="15" r="0.6" fill="white" />
          </g>
        </g>
        
        {/* Smile (opens to 'O' when alerted) */}
        {isAlerted ? (
          <ellipse cx="20" cy="22" rx="2" ry="3" fill="#111" />
        ) : (
          <path 
            d="M 16 21 Q 20 23 24 21" 
            fill="none" 
            stroke="#111" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            className="group-hover:d-[path('M 16 20 Q 20 25 24 20')] transition-all"
          />
        )}
        
        {/* Alert Exclamation */}
        {isAlerted && (
          <g className="animate-bounce" transform="translate(20, -5)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="0" cy="8" r="1.5" fill="#ef4444" />
          </g>
        )}
      </svg>
    </div>
  );
}
