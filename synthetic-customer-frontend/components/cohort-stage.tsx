"use client";

import React, { useState, useEffect, useRef } from "react";

interface CohortStageProps {
  defaultValue?: number;
  onChange?: (count: number) => void;
  disabled?: boolean;
  isInitializing?: boolean;
  targetAudience?: string;
}

interface ZooZooState {
  id: number;
  x: number;
  y: number;
  tx: number;
  vx: number;
  vy: number;
  onGround: boolean;
  phase: number;
  spd: number;
  sc: number;
  depth: number;
  blinkT: number;
  blinking: boolean;
  armT: number;
  legT: number;
  moodT: number;
  born: number;
  squishT: number;
  thought: string | null;
  thoughtT: number;
  dizzyT: number;
  propType: string | null;
}

export function CohortStage({ defaultValue = 20, onChange, disabled, isInitializing, targetAudience = "" }: CohortStageProps) {
  const [count, setCountState] = useState(defaultValue);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoozoosRef = useRef<ZooZooState[]>([]);
  const confettiRef = useRef<{x:number, y:number, vy:number, vx:number, s:number, a:number}[]>([]);
  const nextIdRef = useRef(1);
  const draggingRef = useRef<number | null>(null); // id of dragging zoozoo
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const targetAudienceRef = useRef(targetAudience);

  const getAudienceProp = (audienceStr: string) => {
    const lowerTarget = audienceStr.toLowerCase();
    if (lowerTarget.includes("professional") || lowerTarget.includes("business") || lowerTarget.includes("work")) {
      return "sunglasses";
    } else if (lowerTarget.includes("student") || lowerTarget.includes("school") || lowerTarget.includes("college")) {
      return "cap";
    } else if (lowerTarget.includes("outdoor") || lowerTarget.includes("nature") || lowerTarget.includes("travel")) {
      return "hat";
    }
    return null;
  };

  // Keep ref in sync and dynamically update existing ZooZoos' accessories
  useEffect(() => {
    targetAudienceRef.current = targetAudience;
    const currentProp = getAudienceProp(targetAudience);
    const zzs = zoozoosRef.current;
    for (const z of zzs) {
      const wearsProp = z.id % 6 === 0;
      z.propType = wearsProp ? currentProp : null;
    }
  }, [targetAudience]);

  const setCount = (newCount: number) => {
    setCountState(newCount);
    if (onChange) {
      onChange(newCount);
    }
  };

  useEffect(() => {

    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;
    let t = 0; // frame counter for pop-in age
    let lastInteractTime = Date.now();

    // Canvas scaling
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        const width = parent.clientWidth;
        const height = 210; // CSS height
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
      reLayout();
    };

    const reLayout = () => {
      const width = canvas.clientWidth;
      const zzs = zoozoosRef.current;
      const margin = 34;
      for (const z of zzs) {
        if (isInitializing) {
           z.tx = width / 2 + (Math.random() - 0.5) * 80;
        } else if (z.tx === 0 || z.tx === width / 2) {
           z.tx = margin + Math.random() * (width - margin * 2);
        } else if (z.tx > width - margin) {
           z.tx = width - margin;
        }
      }
    };

    // Initialize resize
    window.addEventListener("resize", resize);
    resize();

    // Spawn confetti once on mount
    if (confettiRef.current.length === 0) {
       for (let i=0; i<40; i++) {
          confettiRef.current.push({
             x: Math.random() * canvas.clientWidth,
             y: -20 - Math.random() * 100,
             vx: (Math.random() - 0.5) * 2,
             vy: 1 + Math.random() * 3,
             s: 0.2 + Math.random() * 0.3,
             a: Math.random() * Math.PI * 2
          });
       }
    }

    const GY = () => canvas.height / (window.devicePixelRatio || 1) - 28;
    const CH = () => canvas.height / (window.devicePixelRatio || 1);

    const updateZooZoosList = (targetCount: number) => {
      const zzs = zoozoosRef.current;
      if (targetCount > zzs.length) {
        const width = canvas.clientWidth;
        const currentProp = getAudienceProp(targetAudienceRef.current);
        for (let i = zzs.length; i < targetCount; i++) {
          const zooId = nextIdRef.current++;
          const wearsProp = zooId % 6 === 0;
          zzs.push({
            id: zooId,
            x: Math.random() * width,
            y: -100 - Math.random() * 200, // Drop in from top
            tx: 0,
            vx: 0,
            vy: 0,
            onGround: false,
            phase: Math.random() * Math.PI * 2,
            spd: 0.55 + Math.random() * 0.5,
            sc: 0.82 + Math.random() * 0.26,
            depth: Math.random(),
            blinkT: Math.random() * 100,
            blinking: false,
            armT: Math.random() * Math.PI * 2,
            legT: Math.random() * Math.PI * 2,
            moodT: Math.random() * Math.PI * 2,
            born: t,
            squishT: 0,
            thought: null,
            thoughtT: 0,
            dizzyT: 0,
            propType: wearsProp ? currentProp : null,
          });
        }
      } else if (targetCount < zzs.length) {
        // Remove from the end, but make sure not to remove the one we're dragging if possible
        let toRemove = zzs.length - targetCount;
        for (let i = zzs.length - 1; i >= 0 && toRemove > 0; i--) {
          if (zzs[i].id !== draggingRef.current) {
            zzs.splice(i, 1);
            toRemove--;
          }
        }
        // If still need to remove, it means we have to remove the dragging one
        if (toRemove > 0) {
          zzs.splice(zzs.length - toRemove, toRemove);
        }
      }
      reLayout();
    };

    updateZooZoosList(count);

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      const groundY = GY();

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Background and Ground
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.fillStyle = "rgba(0,0,0,0.02)";
      ctx.fillRect(0, groundY, width, height - groundY);

      const zzs = zoozoosRef.current;
      
      // Update Physics and Idle Animation
      for (const z of zzs) {
        z.phase += 0.05 * z.spd;

        z.armT += 0.08 * z.spd;
        z.legT += 0.1 * z.spd;
        z.moodT += 0.004;

        if (z.blinkT <= 0) {
          z.blinking = !z.blinking;
          z.blinkT = z.blinking ? 7 : 70 + Math.random() * 110;
        } else {
          z.blinkT--;
        }

        const isDragging = draggingRef.current === z.id;
        const zGroundY = groundY - (1 - z.depth) * 45;

        if (!isDragging) {
          if (z.onGround) {
            z.x += (z.tx - z.x) * 0.07;
            z.y = zGroundY;
            z.vy = 0;
            // walk animation if moving
            const moving = Math.abs(z.tx - z.x) > 1;
            if (moving) {
                z.legT += 0.15;
                z.armT += 0.1;
            }
          } else {
            z.vy += 0.46; // gravity
            z.y += z.vy;
            z.x += z.vx;
            z.vx *= 0.93; // friction

            if (z.y >= zGroundY) {
              z.y = zGroundY;
              z.vy = 0;
              z.onGround = true;
              z.tx = z.x;
            }
          }
          // Clamp X
          if (z.x < 20) z.x = 20;
          if (z.x > width - 20) z.x = width - 20;
        }

        // Thought bubbles logic
        if (z.thoughtT > 0) {
           z.thoughtT--;
        } else if (Math.random() < 0.00015 && z.onGround && draggingRef.current === null) {
           const thoughts = ['💡', '💬', '❓', '🛒', '🤔', '✨', '🍎'];
           z.thought = thoughts[Math.floor(Math.random() * thoughts.length)];
           z.thoughtT = 100 + Math.random() * 50;
        }
      }

      // Collisions (Bowling)
      for (let i = 0; i < zzs.length; i++) {
        for (let j = i + 1; j < zzs.length; j++) {
           const z1 = zzs[i];
           const z2 = zzs[j];
           if (z1.id === draggingRef.current || z2.id === draggingRef.current) continue;
           
           const dx = z1.x - z2.x;
           const dist = Math.abs(dx);
           const minDist = 22 * (z1.sc + z2.sc);
           
           if (dist < minDist && z1.onGround && z2.onGround) {
              const push = (minDist - dist) * 0.5;
              const dir = dx > 0 ? 1 : -1;
              z1.x += push * dir;
              z2.x -= push * dir;
              z1.tx = z1.x;
              z2.tx = z2.x;
              
              // Transfer velocity for bowling effect, only if moving towards each other
              if ((z1.x - z2.x) * (z2.vx - z1.vx) < 0) {
                 const v1 = z1.vx;
                 const v2 = z2.vx;
                 z1.vx = v2 * 0.8;
                 z2.vx = v1 * 0.8;
              }
           }
        }
      }

      // Render Confetti
      for (let i = confettiRef.current.length - 1; i >= 0; i--) {
         const c = confettiRef.current[i];
         c.y += c.vy;
         c.x += c.vx;
         c.a += 0.1;
         if (c.y > height + 20) {
            confettiRef.current.splice(i, 1);
            continue;
         }
         ctx.save();
         ctx.translate(c.x, c.y);
         ctx.rotate(c.a);
         ctx.scale(c.s, c.s);
         ctx.fillStyle = "rgba(0,0,0,0.15)";
         ctx.beginPath();
         ctx.ellipse(0, -10, 15, 20, 0, 0, Math.PI*2);
         ctx.fill();
         ctx.restore();
      }

      const sortedZzs = [...zzs].sort((a, b) => a.depth - b.depth);

      // Draw shadows first
      for (const z of sortedZzs) {
        const age = (t - z.born) / 20; // faster pop in
        const popSc = Math.min(1, age * age);
        const depthScale = 0.65 + z.depth * 0.35;
        const s = z.sc * popSc * depthScale;
        if (s <= 0.01) continue;

        const isDragging = draggingRef.current === z.id;
        const zGroundY = groundY - (1 - z.depth) * 45;
        
        ctx.save();
        ctx.translate(z.x, zGroundY);
        const shadowScale = isDragging ? 0.6 : Math.max(0.2, 1 - (zGroundY - z.y) / 100);
        ctx.scale(1, 0.25);
        ctx.beginPath();
        ctx.arc(0, 0, 15 * s * shadowScale, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fill();
        ctx.restore();
      }

      // Draw characters
      for (const z of sortedZzs) {
        const age = (t - z.born) / 20;
        const popSc = Math.min(1, age * age);
        const depthScale = 0.65 + z.depth * 0.35;
        const s = z.sc * popSc * depthScale;
        if (s <= 0.01) continue;

        const isDragging = draggingRef.current === z.id;

        const headR = 18 * s;
        const bodyW = 15 * s;
        const bodyH = 22 * s;
        
        const bob = Math.sin(z.phase) * 2 * s;
        
        ctx.save();
        ctx.translate(z.x, z.y + (isDragging ? 0 : bob));
        
        // Squish transform
        if (z.squishT > 0) {
           z.squishT--;
           const sq = Math.sin((z.squishT / 20) * Math.PI);
           ctx.translate(0, 15 * s * sq);
           ctx.scale(1 + 0.4 * sq, 1 - 0.3 * sq);
        }

        if (!isDragging) {
          let rot = Math.sin(z.phase * 0.4) * 0.035;
          if (z.dizzyT > 0) {
             z.dizzyT--;
             rot += Math.sin(z.dizzyT * 0.3) * 0.25; // Wobble
          }
          ctx.rotate(rot);
        }

        const bodyTopY = -(headR * 0.9 + bodyH);
        const headCY = bodyTopY - headR * 0.7;

        if (isDragging) {
           ctx.beginPath();
           ctx.arc(0, headCY, headR * 1.6 + 8, 0, Math.PI * 2);
           ctx.setLineDash([4, 4]);
           ctx.lineWidth = 1.5;
           ctx.strokeStyle = "rgba(0,0,0,0.2)";
           ctx.stroke();
           ctx.setLineDash([]);
        }

        const lw = 6.5 * s;
        ctx.lineWidth = lw;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Legs
        const legSwing = Math.sin(z.legT) * 11 * s;
        ctx.strokeStyle = "#e0e0e0";
        // Left leg
        ctx.beginPath();
        ctx.moveTo(-bodyW * 0.3, bodyTopY + bodyH * 0.8);
        ctx.quadraticCurveTo(-bodyW * 0.5 - legSwing * 0.5, bodyTopY + bodyH + 5 * s, -4 * s - legSwing, 0);
        ctx.stroke();
        // Right leg
        ctx.beginPath();
        ctx.moveTo(bodyW * 0.3, bodyTopY + bodyH * 0.8);
        ctx.quadraticCurveTo(bodyW * 0.5 + legSwing * 0.5, bodyTopY + bodyH + 5 * s, 4 * s + legSwing, 0);
        ctx.stroke();

        // Arms
        const armSwing = Math.sin(z.armT) * 20 * s;
        ctx.strokeStyle = "#d8d8d8";
        // Left arm
        ctx.beginPath();
        ctx.moveTo(-bodyW * 0.45, bodyTopY + bodyH * 0.35);
        ctx.quadraticCurveTo(-bodyW * 1.5, bodyTopY + bodyH * 0.6, -bodyW * 0.8 - armSwing, bodyTopY + bodyH * 0.9);
        ctx.stroke();
        // Right arm
        ctx.beginPath();
        ctx.moveTo(bodyW * 0.45, bodyTopY + bodyH * 0.35);
        ctx.quadraticCurveTo(bodyW * 1.5, bodyTopY + bodyH * 0.6, bodyW * 0.8 + armSwing, bodyTopY + bodyH * 0.9);
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.ellipse(0, bodyTopY + bodyH * 0.5, bodyW * 0.5, bodyH * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#f2f2f2";
        ctx.fill();
        ctx.lineWidth = 1 * s;
        ctx.strokeStyle = "#d5d5d5";
        ctx.stroke();

        // Head
        ctx.beginPath();
        ctx.ellipse(0, headCY, headR * 0.94, headR, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#f5f5f5";
        ctx.fill();
        ctx.strokeStyle = "#ddd";
        ctx.stroke();

        // Props (sunglasses, cap, hat)
        if (z.propType === 'sunglasses') {
           ctx.fillStyle = "#111";
           ctx.beginPath();
           ctx.ellipse(-headR*0.3, headCY - headR*0.1, headR*0.3, headR*0.2, 0, 0, Math.PI*2);
           ctx.ellipse(headR*0.3, headCY - headR*0.1, headR*0.3, headR*0.2, 0, 0, Math.PI*2);
           ctx.fill();
           ctx.beginPath();
           ctx.moveTo(-headR*0.6, headCY - headR*0.1);
           ctx.lineTo(headR*0.6, headCY - headR*0.1);
           ctx.lineWidth = 2 * s;
           ctx.stroke();
        } else if (z.propType === 'cap') {
           ctx.fillStyle = "#3b82f6";
           ctx.beginPath();
           ctx.ellipse(0, headCY - headR*0.8, headR*0.9, headR*0.4, 0, Math.PI, 0);
           ctx.fill();
           // brim
           ctx.beginPath();
           ctx.ellipse(headR*0.4, headCY - headR*0.8, headR*0.7, headR*0.15, 0, 0, Math.PI*2);
           ctx.fill();
        } else if (z.propType === 'hat') {
           ctx.fillStyle = "#eab308"; // yellow hard hat / outdoor hat
           ctx.beginPath();
           ctx.ellipse(0, headCY - headR*0.7, headR, headR*0.2, 0, 0, Math.PI*2);
           ctx.fill();
           ctx.beginPath();
           ctx.ellipse(0, headCY - headR*0.8, headR*0.6, headR*0.5, 0, Math.PI, 0);
           ctx.fill();
        }

        // Eyes (skip if sunglasses)
        if (z.propType !== 'sunglasses') {
          const eyeOffset = headR * 0.35;
          const eyeY = headCY - headR * 0.1;
          
          let eyeRx = headR * 0.12;
        let eyeRy = z.blinking ? headR * 0.03 : headR * 0.15;

        if (isDragging) {
           eyeRx = headR * 0.22;
           eyeRy = headR * 0.25;
        }
        
        // Calculate look offset
        let lookDx = 0;
        let lookDy = 0;
        if (mouseHoverPos.x !== -1000 && !isDragging && z.dizzyT <= 0) {
           const absHeadX = z.x;
           const absHeadY = z.y + bob + headCY;
           const dx = mouseHoverPos.x - absHeadX;
           const dy = mouseHoverPos.y - absHeadY;
           const dist = Math.sqrt(dx*dx + dy*dy);
           if (dist > 0) {
             const maxLook = headR * 0.2;
             lookDx = (dx / dist) * Math.min(maxLook, dist * 0.05);
             lookDy = (dy / dist) * Math.min(maxLook, dist * 0.05);
           }
        }

        if (z.dizzyT > 0) {
           // Spiral Eyes
           ctx.strokeStyle = "#1a1a1a";
           ctx.lineWidth = 1.2 * s;
           
           ctx.beginPath();
           for (let i=0; i<12; i++) {
              const r = (i/12) * eyeRx;
              const angle = i * Math.PI * 0.6 + (z.dizzyT * 0.15);
              const sx = -eyeOffset + Math.cos(angle)*r;
              const sy = eyeY + Math.sin(angle)*r;
              if (i===0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
           }
           ctx.stroke();

           ctx.beginPath();
           for (let i=0; i<12; i++) {
              const r = (i/12) * eyeRx;
              const angle = i * Math.PI * 0.6 + (z.dizzyT * 0.15);
              const sx = eyeOffset + Math.cos(angle)*r;
              const sy = eyeY + Math.sin(angle)*r;
              if (i===0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
           }
           ctx.stroke();
        } else {
           ctx.fillStyle = "#1a1a1a";
           // Left eye
           ctx.beginPath();
           ctx.ellipse(-eyeOffset + lookDx, eyeY + lookDy, eyeRx, eyeRy, 0, 0, Math.PI * 2);
           ctx.fill();
           // Right eye
           ctx.beginPath();
           ctx.ellipse(eyeOffset + lookDx, eyeY + lookDy, eyeRx, eyeRy, 0, 0, Math.PI * 2);
           ctx.fill();

           // Specular dot
           if (!z.blinking && !isDragging) {
             ctx.fillStyle = "white";
             ctx.beginPath();
             ctx.arc(-eyeOffset + lookDx + eyeRx * 0.3, eyeY + lookDy - eyeRy * 0.3, headR * 0.04, 0, Math.PI * 2);
             ctx.fill();
             ctx.beginPath();
             ctx.arc(eyeOffset + lookDx + eyeRx * 0.3, eyeY + lookDy - eyeRy * 0.3, headR * 0.04, 0, Math.PI * 2);
             ctx.fill();
           } else if (isDragging) {
             // Smaller specular dot for wide eyes
             ctx.fillStyle = "white";
             ctx.beginPath();
             ctx.arc(-eyeOffset, eyeY - eyeRy * 0.4, headR * 0.03, 0, Math.PI * 2);
             ctx.fill();
             ctx.beginPath();
             ctx.arc(eyeOffset, eyeY - eyeRy * 0.4, headR * 0.03, 0, Math.PI * 2);
             ctx.fill();
           }
          }
        }

        // Smile / Mouth
        const smileW = headR * 0.28;
        const smileY = headCY + headR * 0.25;
        
        ctx.beginPath();
        if (isDragging || z.dizzyT > 0) {
          // Surprised / Dizzy O mouth
          ctx.arc(0, smileY + 2 * s, 3.5 * s, 0, Math.PI * 2);
          ctx.fillStyle = "#1a1a1a";
          ctx.fill();
        } else if (z.squishT > 0) {
          // Huge grin when squished
          ctx.moveTo(-smileW * 1.5, smileY);
          ctx.quadraticCurveTo(0, smileY + 8 * s, smileW * 1.5, smileY);
          ctx.strokeStyle = "#1a1a1a";
          ctx.lineWidth = 2 * s;
          ctx.stroke();
        } else {
          const smileCurve = Math.sin(z.moodT) * 2 * s + 3 * s; // 1 to 5 curve
          ctx.moveTo(-smileW, smileY);
          ctx.quadraticCurveTo(0, smileY + smileCurve, smileW, smileY);
          ctx.strokeStyle = "#1a1a1a";
          ctx.lineWidth = 1.5 * s;
          ctx.stroke();
        }

        ctx.restore();

        // Draw thought bubble (on top)
        if (z.thoughtT > 0 && z.thought && !isDragging) {
           const fade = Math.min(1, z.thoughtT / 20);
           if (fade > 0) {
               ctx.save();
               ctx.globalAlpha = fade;
               const bx = z.x + 18 * s;
               const by = z.y + bob + headCY - headR * 1.3; // above actual head
               
               // Bubble tail
               ctx.beginPath();
               ctx.moveTo(bx - 10*s, by + 5*s);
               ctx.quadraticCurveTo(bx - 15*s, by + 15*s, bx - 5*s, by + 20*s);
               ctx.quadraticCurveTo(bx - 5*s, by + 10*s, bx + 5*s, by + 5*s);
               ctx.fillStyle = "white";
               ctx.fill();
               ctx.strokeStyle = "#ddd";
               ctx.lineWidth = 1;
               ctx.stroke();

               // Bubble body
               ctx.beginPath();
               ctx.ellipse(bx, by, 18*s, 14*s, 0, 0, Math.PI * 2);
               ctx.fillStyle = "white";
               ctx.fill();
               ctx.stroke();
               
               // Text
               ctx.fillStyle = "black";
               ctx.font = `${11*s}px sans-serif`;
               ctx.textAlign = "center";
               ctx.textBaseline = "middle";
               ctx.fillText(z.thought, bx, by + 1*s);
               ctx.restore();
           }
        }
      }

      // Initialization Spotlight Overlay
      if (isInitializing) {
        ctx.save();
        const grad = ctx.createRadialGradient(width/2, height/2 + 20, 0, width/2, height/2 + 20, width/2);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, "rgba(0,0,0,0.6)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      ctx.restore();

      t++;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Mouse/Touch Events
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    let lastMousePos = { x: 0, y: 0 };
    let mouseHoverPos = { x: -1000, y: -1000 };
    let vxSum = 0;
    
    // Tracking for interactions
    let downTime = 0;
    let downPos = { x: 0, y: 0 };
    let dragShakeCount = 0;
    let lastDx = 0;

    const onHover = (e: MouseEvent) => {
      lastInteractTime = Date.now();
      mouseHoverPos = getPos(e);
      
      // Check for hover personas
      const sortedForHit = [...zoozoosRef.current].sort((a, b) => a.depth - b.depth);
      for (let i = sortedForHit.length - 1; i >= 0; i--) {
        const z = sortedForHit[i];
        if (z.thoughtT > 0 || draggingRef.current !== null) continue;
        const s = z.sc * (0.65 + z.depth * 0.35);
        const headR = 18 * s;
        const bodyH = 22 * s;
        const headCY = z.y - (headR * 0.9 + bodyH) - headR * 0.7;
        
        const dx = mouseHoverPos.x - z.x;
        const dy = mouseHoverPos.y - headCY;
        if (Math.sqrt(dx * dx + dy * dy) <= headR * 1.5) {
           const personas = ["Techie", "Foodie", "Parent", "Student", "Gamer", "Pro"];
           z.thought = personas[Math.floor(Math.random() * personas.length)];
           z.thoughtT = 80;
           break;
        }
      }
    };
    const onLeave = () => {
      mouseHoverPos = { x: -1000, y: -1000 };
    };

    const onDblClick = (e: MouseEvent) => {
      if (disabled) return;
      const zzs = zoozoosRef.current;
      for (const z of zzs) {
         if (z.onGround) {
            z.vy = -3 - Math.random() * 4;
            z.onGround = false;
         }
      }
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      if (disabled) return;
      const { x, y } = getPos(e);
      lastMousePos = { x, y };
      downPos = { x, y };
      downTime = Date.now();
      dragShakeCount = 0;
      lastDx = 0;
      vxSum = 0;
      
      const sortedForHit = [...zoozoosRef.current].sort((a, b) => a.depth - b.depth);
      // Reverse iterate to pick top-most
      for (let i = sortedForHit.length - 1; i >= 0; i--) {
        const z = sortedForHit[i];
        const depthScale = 0.65 + z.depth * 0.35;
        const s = z.sc * depthScale;
        const headR = 18 * s;
        const bodyH = 22 * s;
        const bodyTopY = -(headR * 0.9 + bodyH);
        const headCY = z.y + bodyTopY - headR * 0.7;
        
        const dx = x - z.x;
        const dy = y - headCY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= headR * 1.6 + 8) {
          draggingRef.current = z.id;
          dragOffsetRef.current = { x: z.x - x, y: z.y - y };
          if (e.cancelable) e.preventDefault();
          break;
        }
      }
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getPos(e);
      mouseHoverPos = { x, y };
      if (!draggingRef.current || disabled) return;
      
      // Calculate velocity and shake
      const dx = x - lastMousePos.x;
      if (Math.sign(dx) !== Math.sign(lastDx) && Math.abs(dx) > 2) {
         dragShakeCount++;
      }
      lastDx = dx;
      
      vxSum = (vxSum * 0.5) + dx;
      lastMousePos = { x, y };

      const z = zoozoosRef.current.find(z => z.id === draggingRef.current);
      if (z) {
        z.x = x + dragOffsetRef.current.x;
        z.y = y + dragOffsetRef.current.y;
        z.onGround = false;
        z.vy = 0;
        z.vx = 0;
      }
      if (e.cancelable) e.preventDefault();
    };

    const onUp = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current || disabled) return;
      
      const dist = Math.hypot(lastMousePos.x - downPos.x, lastMousePos.y - downPos.y);
      const time = Date.now() - downTime;
      const isTap = dist < 10 && time < 250 && dragShakeCount === 0;

      const z = zoozoosRef.current.find(z => z.id === draggingRef.current);
      if (z) {
        if (isTap) {
          // Squish
          z.squishT = 20;
          z.onGround = true;
          // Return to actual ground height
          z.y = GY() - (1 - z.depth) * 45;
        } else {
          if (dragShakeCount > 6) {
             z.dizzyT = 200;
          }
          z.vx = vxSum * 0.22;
          z.vy = -3 - Math.random() * 2;
          z.onGround = false;
          
          // Curious Huddle
          let huddled = 0;
          for (const other of zoozoosRef.current) {
             if (other.id !== z.id && Math.random() < 0.25 && huddled < 2) {
                other.tx = z.x + (Math.random() - 0.5) * 80;
                huddled++;
             }
          }
        }
      }
      draggingRef.current = null;
    };

    canvas.addEventListener('mousemove', onHover);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    
    canvas.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
      
      canvas.removeEventListener('mousemove', onHover);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [count, disabled, isInitializing]); // Re-run effect setup if props change (targetAudience omitted to prevent re-render glitches)

  // Effect for initialization cheer jump
  useEffect(() => {
    if (isInitializing) {
       for (const z of zoozoosRef.current) {
         z.vy = -3 - Math.random() * 4;
         z.onGround = false;
       }
    }
  }, [isInitializing]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCount(parseInt(e.target.value, 10));
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Controls UI */}
      <div className="flex items-center gap-4">
        <label className="text-[13px] font-medium text-foreground whitespace-nowrap">
          Cohort size
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={count}
          onChange={handleSliderChange}
          disabled={disabled}
          className="flex-1 accent-neutral-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ height: "4px" }}
        />
        <div className="text-right min-w-[100px]">
          <span className="text-[22px] font-medium text-foreground mr-1">{count}</span>
          <span className="text-[13px] text-muted-foreground">personas</span>
        </div>
      </div>

      {/* Stage Visual */}
      <div className="w-full rounded-xl border border-border/50 bg-secondary/20 overflow-hidden relative" style={{ height: 210 }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
        />
      </div>

      {/* Hint Text */}
      <p className="text-[12px] text-muted-foreground text-center">
        Drag any ZooZoo to fling them around. Double click to make them jump!
      </p>
    </div>
  );
}
