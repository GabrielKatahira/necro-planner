import { useEffect, useRef } from "react";
import { useViewport } from "reactflow";

interface Star {
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
  a: number; // index into the owning chunk's stars array
  b: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface Chunk {
  key: string;
  originX: number;
  originY: number;
  stars: Star[];
  links: ConstellationLink[];
  linkedIndices: Set<number>;
}

const CHUNK_SIZE = 1000;
const STARS_PER_CHUNK = 60;
const MAX_LINK_DISTANCE = 250;

function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashChunkCoord(cx: number, cy: number): number {
  return cx * 374761393 + cy * 668265263;
}

function generateChunk(cx: number, cy: number): Chunk {
  const rand = seededRandom(hashChunkCoord(cx, cy));
  const originX = cx * CHUNK_SIZE;
  const originY = cy * CHUNK_SIZE;

  const stars: Star[] = [];
  for (let i = 0; i < STARS_PER_CHUNK; i++) {
    stars.push({
      x: originX + rand() * CHUNK_SIZE,
      y: originY + rand() * CHUNK_SIZE,
      radius: rand() * 1.5 + 0.3,
      baseOpacity: rand() * 0.5 + 0.3,
      twinkleSpeed: rand() * 0.002 + 0.0005,
      twinklePhase: rand() * Math.PI * 2,
      driftX: (rand() - 0.5) * 2,
      driftY: (rand() - 0.5) * 2,
    });
  }

  const links: ConstellationLink[] = [];
  const eligibleCount = Math.floor(STARS_PER_CHUNK * 0.3);
  for (let i = 0; i < eligibleCount; i++) {
    const a = Math.floor(rand() * STARS_PER_CHUNK);
    const candidates: number[] = [];
    for (let b = 0; b < STARS_PER_CHUNK; b++) {
      if (b === a) continue;
      const dx = stars[a].x - stars[b].x;
      const dy = stars[a].y - stars[b].y;
      if (Math.sqrt(dx * dx + dy * dy) < MAX_LINK_DISTANCE) candidates.push(b);
    }
    if (candidates.length > 0) {
      const b = candidates[Math.floor(rand() * candidates.length)];
      links.push({ a, b, pulseSpeed: rand() * 0.0008 + 0.0002, pulsePhase: rand() * Math.PI * 2 });
    }
  }

  const linkedIndices = new Set<number>();
  links.forEach((link) => {
    linkedIndices.add(link.a);
    linkedIndices.add(link.b);
  });

  return { key: `${cx},${cy}`, originX, originY, stars, links, linkedIndices };
}

function getVisibleWorldBounds(viewport: { x: number; y: number; zoom: number }, screenWidth: number, screenHeight: number) {
  return {
    left: -viewport.x / viewport.zoom,
    top: -viewport.y / viewport.zoom,
    width: screenWidth / viewport.zoom,
    height: screenHeight / viewport.zoom,
  };
}

export default function StarfieldBackground() {
  const { x, y, zoom } = useViewport();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chunksRef = useRef<Map<string, Chunk>>(new Map());
  const viewportRef = useRef({ x, y, zoom });

  useEffect(() => {
    viewportRef.current = { x, y, zoom };
  }, [x, y, zoom]);


  useEffect(() => {
    const bounds = getVisibleWorldBounds({ x, y, zoom }, window.innerWidth, window.innerHeight);
    const margin = CHUNK_SIZE;

    const minCx = Math.floor((bounds.left - margin) / CHUNK_SIZE);
    const maxCx = Math.floor((bounds.left + bounds.width + margin) / CHUNK_SIZE);
    const minCy = Math.floor((bounds.top - margin) / CHUNK_SIZE);
    const maxCy = Math.floor((bounds.top + bounds.height + margin) / CHUNK_SIZE);

    const neededKeys = new Set<string>();
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx},${cy}`;
        neededKeys.add(key);
        if (!chunksRef.current.has(key)) {
          chunksRef.current.set(key, generateChunk(cx, cy));
        }
      }
    }

    for (const key of chunksRef.current.keys()) {
      if (!neededKeys.has(key)) chunksRef.current.delete(key);
    }
  }, [x, y, zoom]);

  // canvas always matches the viewport size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // draw loop — runs once, forever, reading live chunk/viewport data via refs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    const draw = (time: number) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const viewport = viewportRef.current;

  for (const chunk of chunksRef.current.values()) {
    ctx.strokeStyle = "white";
    for (const link of chunk.links) {
      const a = chunk.stars[link.a];
      const b = chunk.stars[link.b];
      const pulse = Math.sin(time * link.pulseSpeed + link.pulsePhase);
      const opacity = Math.max(0, pulse) * 0.1;

      // inline math, zero allocation
      const paX = a.x * viewport.zoom + viewport.x;
      const paY = a.y * viewport.zoom + viewport.y;
      const pbX = b.x * viewport.zoom + viewport.x;
      const pbY = b.y * viewport.zoom + viewport.y;

      ctx.globalAlpha = opacity;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paX, paY);
      ctx.lineTo(pbX, pbY);
      ctx.stroke();
    }

    ctx.fillStyle = "white";
    chunk.stars.forEach((star, index) => {
      if (!chunk.linkedIndices.has(index)) {
        star.x += star.driftX;
        star.y += star.driftY;
        if (star.x < chunk.originX || star.x > chunk.originX + CHUNK_SIZE) star.driftX *= -1;
        if (star.y < chunk.originY || star.y > chunk.originY + CHUNK_SIZE) star.driftY *= -1;
        star.x = Math.max(chunk.originX, Math.min(chunk.originX + CHUNK_SIZE, star.x));
        star.y = Math.max(chunk.originY, Math.min(chunk.originY + CHUNK_SIZE, star.y));
      }

      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
      const opacity = star.baseOpacity + twinkle * 0.3;

      // inline math, zero allocation
      const screenX = star.x * viewport.zoom + viewport.x;
      const screenY = star.y * viewport.zoom + viewport.y;

      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
      ctx.beginPath();
      ctx.arc(screenX, screenY, star.radius * viewport.zoom, 0, Math.PI * 2);
      ctx.fill();
        });
      }

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    />
  );
}