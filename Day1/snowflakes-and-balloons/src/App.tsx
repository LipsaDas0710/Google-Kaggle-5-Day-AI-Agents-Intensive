/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Snowflake, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props: any, key?: string | number): any;
  export function jsxs(type: any, props: any, key?: string | number): any;
  export function jsxDEV(type: any, props: any, key?: string | number, isStaticChildren?: boolean, source?: any, self?: any): any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Structure of a physical simulation particle
interface Particle {
  id: string;
  type: 'snowflake' | 'balloon';
  left: number; // percentage width across screen (0 to 100)
  size: number; // size in pixels
  duration: number; // animation transit duration in seconds
  color?: string; // primary gradient colour for balloon
  darkerColor?: string; // shadow gradient colour for balloon
}

// Formal pastel visual palette for premium helium balloons
const BALLOON_COLOR_PALETTE = [
  { primary: '#f43f5e', darker: '#be123c' }, // Slate Crimson / Rose
  { primary: '#3b82f6', darker: '#1d4ed8' }, // Cobalt Blue / Indigo
  { primary: '#0ea5e9', darker: '#0369a1' }, // Cyan / Sky Blue
  { primary: '#10b981', darker: '#047857' }, // Emerald / Jade
  { primary: '#f59e0b', darker: '#b45309' }, // Amber / Ochre
  { primary: '#8b5cf6', darker: '#6d28d9' }, // Amethyst / Violet
];

export default function App() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeType, setActiveType] = useState<'snowflakes' | 'balloons' | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [particleDensity, setParticleDensity] = useState<number>(45); // Represented active slider value
  const [durationWindow, setDurationWindow] = useState<number>(5.0); // Represented active slider value

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Core launcher to trigger specific simulation for exactly 5 seconds
  const triggerSimulation = (type: 'snowflakes' | 'balloons') => {
    // 1. Terminate ongoing interval timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);

    // 2. Clear current canvases & transition active states
    setParticles([]);
    setActiveType(type);
    setCountdown(5000); // Exactly 5000ms

    const startTime = Date.now();
    const duration = 5000;

    // 3. Initiate dynamic high-precision countdown
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setCountdown(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        setActiveType(null);
      }
    }, 16); // High accuracy representation

    // 4. Set up dynamic emitter to continuously spawn particles
    const spawnSingleParticle = () => {
      const id = `${type}-${Math.random().toString(36).substr(2, 9)}`;
      let newParticle: Particle;

      if (type === 'snowflakes') {
        newParticle = {
          id,
          type: 'snowflake',
          left: Math.random() * 100,
          size: 16 + Math.random() * 10, // Medium 16px - 26px
          duration: 2.8 + Math.random() * 1.2, // 2.8s - 4.0s fall duration
        };
      } else {
        const colorPair = BALLOON_COLOR_PALETTE[Math.floor(Math.random() * BALLOON_COLOR_PALETTE.length)];
        newParticle = {
          id,
          type: 'balloon',
          left: 6 + Math.random() * 88, // Ensure items stay inside bounds
          size: 38 + Math.random() * 10, // Medium 38px - 48px
          duration: 3.2 + Math.random() * 1.3, // 3.2s - 4.5s float duration
          color: colorPair.primary,
          darkerColor: colorPair.darker,
        };
      }

      setParticles((prev) => [...prev, newParticle]);

      // Safely self-cleanup particle memory after transit path completes
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 5500);
    };

    // Calculate dynamic delay based on density configuration (e.g. 180ms down to 100ms)
    const baseSpawnDelay = Math.max(100, 300 - (particleDensity * 3));

    // Spawn immediately, then continuously repeat
    spawnSingleParticle();
    spawnIntervalRef.current = setInterval(spawnSingleParticle, baseSpawnDelay);
  };

  // Safe release of ref hooks
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, []);

  // Format countdown text with high mechanical precision
  const formatCountdown = (ms: number) => {
    const totalSeconds = ms / 1000;
    return totalSeconds.toFixed(2);
  };

  return (
    <div id="atmos-root" className="w-full min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden text-slate-800 antialiased">
      
      {/* Header Navigation Tab */}
      <nav id="header-nav" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-10 shrink-0 select-none z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center shadow-sm">
            <div className="w-3.5 h-3.5 border-2 border-white rounded-sm rotate-45"></div>
          </div>
          <span className="font-display font-semibold tracking-tight text-lg text-slate-900">
            ATMOS<span className="text-slate-400 font-medium">SYSTEMS</span>
          </span>
        </div>
        
        {/* Navigation Pseudo Links (Visually matched design system) */}
        <div className="hidden md:flex gap-8 text-sm font-medium text-slate-500">
          <span className="text-slate-900 border-b-2 border-slate-900 pb-5 pt-5 cursor-default">Simulation</span>
          <span className="hover:text-slate-900 cursor-pointer py-5 transition-colors">Analytics</span>
          <span className="hover:text-slate-900 cursor-pointer py-5 transition-colors">Configuration</span>
          <span className="hover:text-slate-900 cursor-pointer py-5 transition-colors">Archived Logs</span>
        </div>

        {/* User profile & controls action block */}
        <div className="flex items-center gap-3">
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-medium text-xs flex items-center justify-center border border-slate-200 shadow-inner">
            JD
          </div>
        </div>
      </nav>

      {/* Main workspace layout */}
      <main id="workspace-layout" className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Side Control Panel */}
        <aside id="side-controls-panel" className="w-full md:w-80 bg-white border-r border-slate-200 p-6 sm:p-8 flex flex-col gap-6 sm:gap-8 shrink-0 overflow-y-auto">
          
          {/* Core Commands Trigger Module */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 font-mono">Core Commands</h2>
            <div className="flex flex-col gap-3">
              
              {/* Snowflakes Actuator button */}
              <button
                id="btn-trigger-snowflakes"
                onClick={() => triggerSimulation('snowflakes')}
                className={`group flex items-center justify-between p-4 bg-slate-50 border rounded-lg transition-all text-left w-full cursor-pointer ${
                  activeType === 'snowflakes'
                    ? 'border-blue-400 bg-blue-50/70 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Snowflakes</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Gravity: 9.8m/s² | Top-Down</div>
                </div>
                <div className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${
                  activeType === 'snowflakes'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-slate-200 text-slate-400 group-hover:bg-blue-500 group-hover:border-blue-500 group-hover:text-white'
                }`}>
                  <Snowflake className={`w-4 h-4 ${activeType === 'snowflakes' ? 'animate-spin' : ''}`} />
                </div>
              </button>

              {/* Balloons Actuator button */}
              <button
                id="btn-trigger-balloons"
                onClick={() => triggerSimulation('balloons')}
                className={`group flex items-center justify-between p-4 bg-slate-50 border rounded-lg transition-all text-left w-full cursor-pointer ${
                  activeType === 'balloons'
                    ? 'border-rose-400 bg-rose-50/70 ring-2 ring-rose-100'
                    : 'border-slate-200 hover:border-rose-400 hover:bg-rose-50/30'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Balloons</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Buoyancy: Active | Bottom-Up</div>
                </div>
                <div className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${
                  activeType === 'balloons'
                    ? 'bg-rose-500 border-rose-500 text-white'
                    : 'bg-white border-slate-200 text-slate-400 group-hover:bg-rose-500 group-hover:border-rose-500 group-hover:text-white'
                }`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2A6 6 0 0 0 6 8c0 3.5 2.5 6 6 8 3.5-2 6-4.5 6-8A6 6 0 0 0 12 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v3c0 .5-.5 1-1 1s-1 .5-1 1" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11 16 1 1.5 1-1.5z" />
                  </svg>
                </div>
              </button>

            </div>
          </div>

          {/* Interactive Properties / Variable Tuners */}
          <div className="flex flex-col gap-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Active Properties</h2>
            
            {/* Tuner 1: Particle Density */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Particle Density</span>
                <span className="font-mono text-slate-900">{particleDensity} nodes/s</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="80" 
                value={particleDensity}
                onChange={(e) => setParticleDensity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-ew-resize accent-slate-800" 
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Min</span>
                <span>Max</span>
              </div>
            </div>

            {/* Tuner 2: Duration Window Limit */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Duration Window</span>
                <span className="font-mono text-slate-900">{durationWindow.toFixed(1)} Seconds</span>
              </div>
              <div className="relative">
                {/* Active status indicator timeline highlight */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-800 rounded-full transition-all duration-75"
                    style={{ width: activeType ? `${(countdown / 5000) * 100}%` : '100%' }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                Timer represents simulated duration of physical emitter activity.
              </span>
            </div>

          </div>

          {/* Footer status dashboard block (system feedback context) */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className={`p-4 rounded-xl transition-colors duration-300 ${
              activeType === 'snowflakes'
                ? 'bg-blue-900 text-white'
                : activeType === 'balloons'
                  ? 'bg-rose-900 text-white'
                  : 'bg-slate-900 text-white'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  activeType ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400 animate-pulse'
                }`} />
                <span className="font-semibold text-xs uppercase tracking-wider font-mono">
                  {activeType ? 'Simulation Active' : 'System Ready'}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {activeType 
                  ? `Broadcasting physical ${activeType} parameters. Clamping emitter terminal output.`
                  : "Waiting for user input sequence to initialize kinetic stage simulation."}
              </p>
              {activeType && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-300">
                  <span>TERMINAL COUNTDOWN:</span>
                  <span className="font-bold underline">{formatCountdown(countdown)}s</span>
                </div>
              )}
            </div>
          </div>

        </aside>

        {/* Main Simulation Viewport Stage */}
        <section id="simulation-stage" className="flex-1 p-6 sm:p-10 flex flex-col min-w-0">
          
          {/* Main Visual Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight leading-none">
                Visual Simulation <span className="font-bold">Stage</span>
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1.5">
                Operational environment for kinetic particle testing and physical buoyancy validation.
              </p>
            </div>
            
            {/* Visual sizing stickers */}
            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest font-mono shrink-0">
              <div className="px-3 py-1 bg-slate-200 text-slate-600 rounded">FLUID_WEB_CANVAS</div>
              <div className="px-3 py-1 bg-slate-800 text-white rounded">PREVIEW NODE</div>
            </div>
          </div>

          {/* Interactive view container block with particle bounds */}
          <div id="kinetic-viewport" className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-inner relative overflow-hidden flex items-center justify-center group">
            
            {/* Visual dot matrix inside stage sandbox to match top-tier feel */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.25]" 
              style={{
                backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Actual dynamic rendering level for our physical generated particles inside viewport box */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              <AnimatePresence>
                {particles.map((p) => {
                  if (p.type === 'snowflake') {
                    return (
                      <motion.div
                        key={p.id}
                        id={`particle-${p.id}`}
                        initial={{ y: '-10%', opacity: 0, x: 0, rotate: 0 }}
                        animate={{ 
                          y: '110%',
                          opacity: [0, 0.9, 0.9, 0],
                          // Fluent swaying side-to-side drafting path
                          x: [0, Math.sin(p.left) * 40, -Math.sin(p.left) * 40, Math.sin(p.left) * 20],
                          rotate: 360
                        }}
                        transition={{
                          duration: p.duration,
                          ease: "linear"
                        }}
                        className="absolute pointer-events-none text-sky-400"
                        style={{ left: `${p.left}%` }}
                      >
                        <Snowflake 
                          size={p.size} 
                          className="drop-shadow-[0_2px_5px_rgba(14,165,233,0.35)]" 
                        />
                      </motion.div>
                    );
                  } else {
                    return (
                      <motion.div
                        key={p.id}
                        id={`particle-${p.id}`}
                        initial={{ y: '110%', opacity: 0, x: 0, rotate: 0 }}
                        animate={{ 
                          y: '-18%',
                          opacity: [0, 1, 1, 0],
                          // Gentle realistic wavy lateral swaying draft
                          x: [0, Math.cos(p.left) * 50, -Math.cos(p.left) * 50, Math.cos(p.left) * 25],
                          rotate: [0, 6, -6, 3, 0]
                        }}
                        transition={{
                          duration: p.duration,
                          ease: [0.25, 0.1, 0.25, 1] // Warm helium simulation velocity curves
                        }}
                        className="absolute pointer-events-none flex flex-col items-center"
                        style={{ left: `${p.left}%` }}
                      >
                        {/* Shaded physical realistic balloon */}
                        <div 
                          className="rounded-t-full rounded-b-[40px] relative shadow-lg"
                          style={{ 
                            width: `${p.size}px`, 
                            height: `${p.size * 1.25}px`, 
                            background: `radial-gradient(circle at 35% 30%, ${p.color} 15%, ${p.darkerColor} 100%)`
                          }}
                        >
                          {/* Radial shiny specular overlay accent */}
                          <div className="absolute top-[8%] left-[16%] w-[25%] h-[25%] bg-white/40 rounded-full blur-[0.4px]" />
                          
                          {/* Low end base string knot */}
                          <div 
                            className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px]"
                            style={{ 
                              borderBottomColor: p.darkerColor, 
                              borderLeftColor: 'transparent', 
                              borderRightColor: 'transparent' 
                            }}
                          />
                        </div>
                        {/* Stabilizing thin rope */}
                        <div className="w-[1px] h-16 bg-slate-400 opacity-40 origin-top animate-pulse" />
                      </motion.div>
                    );
                  }
                })}
              </AnimatePresence>
            </div>

            {/* Default Status Helper (Visible primarily when idle to guide user interactions) */}
            <div className={`text-center z-10 transition-opacity duration-500 pointer-events-none ${
              activeType ? 'opacity-10' : 'opacity-100'
            }`}>
              <div className="w-16 h-16 border-4 border-dashed border-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center bg-slate-50 group-hover:scale-105 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                  <path d="M9 3v18"/>
                  <path d="M3 9h18"/>
                  <path d="M3 15h18"/>
                </svg>
              </div>
              <p className="text-slate-400 font-medium text-sm">
                Select a simulation command from the sidebar<br />
                <span className="text-slate-300 text-xs">to begin visual kinetic particle rendering</span>
              </p>
            </div>

            {/* Architectural Engineering Corners */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-slate-200"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-slate-200"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-slate-200"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-slate-200"></div>
          </div>

          {/* Precision Engineering Metadata Footer */}
          <footer className="mt-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest font-mono select-none">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse"></span> Local Simulating Engine
              </span>
              <span>Latency: 12ms</span>
              <span>Cache: Cleared</span>
              {particles.length > 0 && (
                <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded transition-all">
                  Active Vector Nodes: {particles.length}
                </span>
              )}
            </div>
            <div>Formal Simulation Engine v2.4.0</div>
          </footer>

        </section>

      </main>

    </div>
  );
}
