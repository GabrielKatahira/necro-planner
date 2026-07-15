import { useEffect, useRef } from "react";
import { useViewport } from "reactflow";

interface Star{
    x: number;
    y: number;
    radius: number;
    baseOpacity: number;
    twinkleSpeed: number;
    twinklePhase: number;
    driftX: number;
    driftY: number;
}

interface ConstellationLink {
  a: number; 
  b: number;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface Props {
  width: number; 
  height: number;
  starCount?: number;
}

export default function StarfieldBackground({ width, height, starCount = 500 }: Props) {
  const { x, y, zoom } = useViewport();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const linksRef = useRef<ConstellationLink[]>([]);
  const linkedIndicesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.3,
        baseOpacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.002 + 0.0005,
        twinklePhase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 2,
        driftY: (Math.random() - 0.5) * 2,
      });
    }
    starsRef.current = stars;

    const links: ConstellationLink[] = [];
    const maxDistance = 250;
    const eligibleCount = Math.floor(starCount * 0.5);

    for (let i = 0; i < eligibleCount; i++) {
    const a = Math.floor(Math.random() * starCount);

    const candidates: number[] = [];
    for (let b = 0; b < starCount; b++) {
        if (b === a) continue;
        const dx = stars[a].x - stars[b].x;
        const dy = stars[a].y - stars[b].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDistance) candidates.push(b);
    }

    if (candidates.length > 0) {
        const b = candidates[Math.floor(Math.random() * candidates.length)];
        links.push({
        a,
        b,
        opacity: 0,
        pulseSpeed: Math.random() * 0.0008 + 0.0002,
        pulsePhase: Math.random() * Math.PI * 2,
        });
    }
    }
    linksRef.current = links;

    const linkedStarIndices = new Set<number>();
    links.forEach((link) => {
    linkedStarIndices.add(link.a);
    linkedStarIndices.add(link.b);
    });
    linkedIndicesRef.current = linkedStarIndices;
  }, [width, height, starCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    let rafId: number;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "white";

        ctx.strokeStyle = "white";
        for (const link of linksRef.current) {
            const a = starsRef.current[link.a];
            const b = starsRef.current[link.b];
            const pulse = Math.sin(time * link.pulseSpeed + link.pulsePhase);
            const opacity = Math.max(0, pulse) * 0.40; // faint, only visible during "on" phase of pulse

            ctx.globalAlpha = opacity;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

      starsRef.current.forEach((star, index) => {
        if (!linkedIndicesRef.current.has(index)) {
            star.x += star.driftX;
            star.y += star.driftY;
            if (star.x < 0 || star.x > width) star.driftX *= -1;
            if (star.y < 0 || star.y > height) star.driftY *= -1;
            star.x = Math.max(0, Math.min(width, star.x));
            star.y = Math.max(0, Math.min(height, star.y));
        }

        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        const opacity = star.baseOpacity + twinkle * 0.3;

        ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      })
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [width, height]);

  return (
   <div
    style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        transformOrigin: "0 0", 
        pointerEvents: "none",
    }}
    >
  <div style={{ position: "absolute", top: -height / 2, left: -width / 2 }}>
    <canvas ref={canvasRef} width={width} height={height} />
  </div>
</div>
  );
}