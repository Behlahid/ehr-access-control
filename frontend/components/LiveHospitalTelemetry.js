"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Activity,
  Cpu,
  Shield,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Radio,
  Sparkles,
  TrendingUp,
  Droplets,
  Layers,
  ChevronRight
} from "lucide-react";

export default function LiveHospitalTelemetry() {
  // Live Physiological State Engine
  const [bpm, setBpm] = useState(72);
  const [spo2, setSpo2] = useState(99);
  const [systolic, setSystolic] = useState(118);
  const [diastolic, setDiastolic] = useState(78);
  const [glucose, setGlucose] = useState(92);
  const [isBeating, setIsBeating] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isIcuModalOpen, setIsIcuModalOpen] = useState(false);
  const [secondsConnected, setSecondsConnected] = useState(148);

  const audioCtxRef = useRef(null);
  const ecgCanvasRef = useRef(null);
  const spo2CanvasRef = useRef(null);
  const modalEcgCanvasRef = useRef(null);
  const modalSpo2CanvasRef = useRef(null);
  const modalRespCanvasRef = useRef(null);

  // Play gentle clinical bedside telemetry beep on systole
  const playBedsideBeep = (freq = 880) => {
    if (!isAudioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      console.warn("AudioContext tone blocked or unavailable:", e);
    }
  };

  // Live Physiological Heartbeat Interval & Drift
  useEffect(() => {
    const beatInterval = (60 / bpm) * 1000;
    const timer = setInterval(() => {
      // Trigger systole contraction pulse
      setIsBeating(true);
      playBedsideBeep(880);
      setTimeout(() => setIsBeating(false), 160);

      // Natural Respiratory Sinus Arrhythmia (RSA) subtle BPM micro-drift
      setBpm((prev) => {
        const drift = Math.random() > 0.5 ? 1 : -1;
        const next = prev + drift;
        return next >= 70 && next <= 74 ? next : 72;
      });

      // Natural SpO2 pleth drift
      if (Math.random() < 0.15) {
        setSpo2(Math.random() > 0.5 ? 98 : 99);
      }

      // Micro arterial pressure drift
      if (Math.random() < 0.1) {
        const delta = Math.random() > 0.5 ? 1 : -1;
        setSystolic((s) => (s + delta >= 116 && s + delta <= 120 ? s + delta : 118));
        setDiastolic((d) => (d + delta >= 76 && d + delta <= 80 ? d + delta : 78));
      }

      // Continuous glucose monitor micro-drift
      if (Math.random() < 0.08) {
        setGlucose((g) => (g + (Math.random() > 0.5 ? 1 : -1) >= 90 && g <= 94 ? g + 1 : 92));
      }
    }, beatInterval);

    return () => clearInterval(timer);
  }, [bpm, isAudioEnabled]);

  // Telemetry uptime ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondsConnected((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  // Format connection duration
  const formatUptime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Mean Arterial Pressure (MAP = (2*Diastolic + Systolic) / 3)
  const mapValue = Math.round((2 * diastolic + systolic) / 3);

  // 60FPS Sweeping Hospital Waveform Engine (Philips IntelliVue & GE Carescape Algorithm)
  useEffect(() => {
    let animationFrameId;
    let sweepX = 0;

    // Standard clinical Lead II ECG generator
    const getEcgSample = (phase) => {
      // phase between 0 and 1
      if (phase < 0.12) return 0; // Baseline
      if (phase < 0.22) {
        // P Wave (Atrial depolarization)
        const p = (phase - 0.12) / 0.1;
        return Math.sin(p * Math.PI) * 0.18;
      }
      if (phase < 0.32) return 0; // PR segment
      if (phase < 0.35) {
        // Q Wave (Septal depolarization)
        const q = (phase - 0.32) / 0.03;
        return -Math.sin(q * Math.PI) * 0.15;
      }
      if (phase < 0.42) {
        // R Wave (Ventricular depolarization spike)
        const r = (phase - 0.35) / 0.07;
        return Math.sin(r * Math.PI) * 1.0;
      }
      if (phase < 0.47) {
        // S Wave
        const s = (phase - 0.42) / 0.05;
        return -Math.sin(s * Math.PI) * 0.35;
      }
      if (phase < 0.58) return 0; // ST segment
      if (phase < 0.78) {
        // T Wave (Ventricular repolarization)
        const t = (phase - 0.58) / 0.2;
        return Math.sin(t * Math.PI) * 0.32;
      }
      return 0; // Baseline
    };

    // Photoplethysmogram (PPG) Arterial Pulse Waveform generator
    const getSpo2Sample = (phase) => {
      if (phase < 0.2) {
        // Systolic upstroke
        const u = phase / 0.2;
        return Math.sin((u * Math.PI) / 2);
      }
      if (phase < 0.45) {
        // Systolic peak and decline to dicrotic notch
        const d = (phase - 0.2) / 0.25;
        return 1 - d * 0.55;
      }
      if (phase < 0.55) {
        // Dicrotic notch and secondary wave
        const n = (phase - 0.45) / 0.1;
        return 0.45 + Math.sin(n * Math.PI) * 0.12;
      }
      // Diastolic runoff
      const r = (phase - 0.55) / 0.45;
      return 0.45 * Math.exp(-r * 3.5);
    };

    // Thoracic Impedance Respiration Waveform generator
    const getRespSample = (phase) => {
      return (Math.sin(phase * Math.PI * 2) + 1) / 2;
    };

    const render = () => {
      const now = performance.now();
      const cycleDuration = (60 / bpm) * 1000;
      const phase = (now % cycleDuration) / cycleDuration;
      const respDuration = 4000; // 15 breaths/min
      const respPhase = (now % respDuration) / respDuration;

      const ecgVal = getEcgSample(phase);
      const spo2Val = getSpo2Sample(phase);
      const respVal = getRespSample(respPhase);

      const canvases = [
        { ref: ecgCanvasRef, val: ecgVal, color: "#06b6d4", glow: "rgba(6, 182, 212, 0.4)", scale: 0.85, isEcg: true },
        { ref: spo2CanvasRef, val: spo2Val, color: "#10b981", glow: "rgba(16, 185, 129, 0.4)", scale: 0.75, isEcg: false },
        { ref: modalEcgCanvasRef, val: ecgVal, color: "#00ff88", glow: "rgba(0, 255, 136, 0.6)", scale: 0.85, isEcg: true },
        { ref: modalSpo2CanvasRef, val: spo2Val, color: "#00e5ff", glow: "rgba(0, 229, 255, 0.6)", scale: 0.8, isEcg: false },
        { ref: modalRespCanvasRef, val: respVal, color: "#ffea00", glow: "rgba(255, 234, 0, 0.6)", scale: 0.65, isEcg: false },
      ];

      canvases.forEach(({ ref, val, color, glow, scale, isEcg }) => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;

        const x = sweepX % w;
        // Erase lead bar 8px ahead of cursor (authentic hospital monitor sweep eraser)
        ctx.clearRect(x, 0, 10, h);

        const midY = h / 2;
        let y;
        if (isEcg) {
          y = midY - val * (midY * scale);
        } else {
          y = h - 6 - val * (h - 14) * scale;
        }

        ctx.shadowBlur = 6;
        ctx.shadowColor = glow;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(x <= 2 ? 0 : x - 2, y);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      sweepX = (sweepX + 1.8) % 10000;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [bpm]);

  return (
    <section className="flex flex-col gap-3.5">
      {/* HEADER: CLINICAL TELEMETRY BEACON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-2xs">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Executive Vitals &amp; Continuous Telemetry
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live 125Hz Stream
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              ST. JUDE ENCLAVE NODE #4 • CONTINUOUS BLE SENSOR ARRAY • UPTIME: {formatUptime(secondsConnected)}
            </p>
          </div>
        </div>

        {/* Telemetry Action Controls (Audio Tone & Bedside ICU Mode) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Audio Tone Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!isAudioEnabled) playBedsideBeep(880);
              setIsAudioEnabled((prev) => !prev);
            }}
            className={`h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
              isAudioEnabled
                ? "bg-cyan-50 dark:bg-cyan-500/15 border-cyan-400 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300 ring-2 ring-cyan-500/20"
                : "surface-card hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            }`}
            title={isAudioEnabled ? "Mute Bedside Telemetry Tone" : "Enable Clinical Bedside Pulse Audio"}
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline">Telemetry Sound ON</span>
                <span className="sm:hidden">Audio ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Sound Muted</span>
                <span className="sm:hidden">Muted</span>
              </>
            )}
          </button>

          {/* Bedside ICU Monitor Mode Modal Button */}
          <button
            type="button"
            onClick={() => setIsIcuModalOpen(true)}
            className="btn-premium group h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            title="Launch Full Bedside ICU Oscilloscope Monitor"
          >
            <Maximize2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            <span className="hidden md:inline">ICU Bedside Monitor</span>
            <span className="md:hidden">ICU View</span>
          </button>
        </div>
      </div>

      {/* 4 VITALS BENTO GRID (LIVE CLINICAL TELEMETRY CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: LIVE RESTING HEART RATE (ECG LEAD II) */}
        <div className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Resting Heart Rate</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                Lead II
              </span>
            </div>
            <Heart
              className={`w-4 h-4 text-rose-500 transition-transform duration-150 ${
                isBeating ? "scale-140 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "scale-100"
              }`}
            />
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                {bpm}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">bpm</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isBeating ? "bg-cyan-500 animate-ping" : "bg-cyan-400"}`} />
              QRS: 88ms
            </span>
          </div>

          {/* Real-time Oscilloscope Canvas Sweeping Wave */}
          <div className="my-2 h-11 w-full bg-slate-950/90 rounded-xl overflow-hidden p-1 relative border border-slate-800/80 shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:10px_10px] opacity-40 pointer-events-none" />
            <canvas ref={ecgCanvasRef} width={280} height={40} className="w-full h-full block relative z-10" />
            <span className="absolute bottom-1 right-2 text-[9px] font-mono text-cyan-400/70 pointer-events-none">
              1.0 mV/cm
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Normal Sinus Rhythm
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">PR: 148ms</span>
          </div>
        </div>

        {/* CARD 2: CONTINUOUS ARTERIAL BLOOD PRESSURE (NIBP / ART-LINE) */}
        <div className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Continuous Arterial Pressure</span>
            <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                {systolic}/{diastolic}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">mmHg</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
              MAP: {mapValue}
            </span>
          </div>

          {/* Dynamic Dual Physiological Pressure Gauge */}
          <div className="my-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span>Sys: {systolic}</span>
              <span>Dia: {diastolic}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner relative">
              <div
                className="bg-cyan-600 dark:bg-cyan-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, (systolic / 180) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>Optimal &lt; 120/80</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Stage 1 Norm</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Optimal Perfusion
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Pulse: {systolic - diastolic}</span>
          </div>
        </div>

        {/* CARD 3: CONTINUOUS GLUCOSE TELEMETRY (CGM DEXCOM / ENCLAVE SENSOR) */}
        <div className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Continuous Glucose (CGM)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                G7 Sensor
              </span>
            </div>
            <Droplets className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                {glucose}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">mg/dL</span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              → Steady (±0)
            </span>
          </div>

          {/* Ambulatory Glucose Profile Graph */}
          <div className="my-2 h-11 w-full bg-purple-950/20 dark:bg-purple-950/40 rounded-xl overflow-hidden relative border border-purple-200/50 dark:border-purple-800/40 flex items-center px-2">
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-purple-700 dark:text-purple-300">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500">Target Range</span>
                <span className="font-bold">70 - 140 mg/dL</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] text-slate-500">Time in Range</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">98% (Optimal)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Euglycemic
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Est. A1C: 4.9%</span>
          </div>
        </div>

        {/* CARD 4: BLOOD OXYGEN & PLETHYSMOGRAPHY (SpO2 PPG) */}
        <div className="surface-card card-premium shimmer-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pulse Oximetry (SpO2)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                Pleth
              </span>
            </div>
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                {spo2}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">SpO2</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              PI: 4.2%
            </span>
          </div>

          {/* Real-time Sweeping Plethysmograph Canvas Wave */}
          <div className="my-2 h-11 w-full bg-slate-950/90 rounded-xl overflow-hidden p-1 relative border border-slate-800/80 shadow-inner">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b_1px,transparent_1px),linear-gradient(to_bottom,#064e3b_1px,transparent_1px)] bg-[size:10px_10px] opacity-25 pointer-events-none" />
            <canvas ref={spo2CanvasRef} width={280} height={40} className="w-full h-full block relative z-10" />
            <span className="absolute bottom-1 right-2 text-[9px] font-mono text-emerald-400/70 pointer-events-none">
              PPG Arterial
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Room Air Saturation
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Signal: 100%</span>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN BEDSIDE ICU MONITOR MODAL (HOSPITAL TELEMETRY CONSOLE) */}
      {isIcuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl bg-[#030712] rounded-3xl border-2 border-slate-800 p-6 shadow-2xl flex flex-col gap-5 text-white font-mono overflow-hidden">
            {/* Header / Hospital Bed ID */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tracking-wider">
                      BEDSIDE ICU TELEMETRY MONITOR • BED 04-A
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      LIVE STREAM
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Patient: Alex Mercer (MRN-84920-A) • Attending: Dr. Sarah Chen, MD, FACC • St. Jude Heart Institute
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAudioEnabled((prev) => !prev)}
                  className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    isAudioEnabled
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {isAudioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
                  <span>{isAudioEnabled ? "Sound ON" : "Sound Muted"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsIcuModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Clinical Waveform Oscilloscope Display */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Waveform Column (3/4 width) */}
              <div className="lg:col-span-3 space-y-4">
                {/* Channel 1: ECG Lead II (Green Trace) */}
                <div className="p-3.5 rounded-2xl bg-black border border-slate-800/90 relative space-y-1">
                  <div className="flex items-center justify-between text-xs text-emerald-400">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">ECG LEAD II</span>
                      <span className="text-[10px] text-emerald-500/70">1.0 mV/cm • 25 mm/s</span>
                    </div>
                    <span className="text-[11px] font-bold">{bpm} BPM</span>
                  </div>
                  <div className="h-20 w-full relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b_1px,transparent_1px),linear-gradient(to_bottom,#064e3b_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none" />
                    <canvas ref={modalEcgCanvasRef} width={680} height={80} className="w-full h-full block relative z-10" />
                  </div>
                </div>

                {/* Channel 2: SpO2 Plethysmograph (Cyan Trace) */}
                <div className="p-3.5 rounded-2xl bg-black border border-slate-800/90 relative space-y-1">
                  <div className="flex items-center justify-between text-xs text-cyan-400">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">PLETH (SpO2)</span>
                      <span className="text-[10px] text-cyan-500/70">Perfusion Index: 4.2%</span>
                    </div>
                    <span className="text-[11px] font-bold">{spo2}% SpO2</span>
                  </div>
                  <div className="h-20 w-full relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#083344_1px,transparent_1px),linear-gradient(to_bottom,#083344_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none" />
                    <canvas ref={modalSpo2CanvasRef} width={680} height={80} className="w-full h-full block relative z-10" />
                  </div>
                </div>

                {/* Channel 3: Thoracic Impedance Respiration (Yellow Trace) */}
                <div className="p-3.5 rounded-2xl bg-black border border-slate-800/90 relative space-y-1">
                  <div className="flex items-center justify-between text-xs text-amber-400">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">RESP (Thoracic Impedance)</span>
                      <span className="text-[10px] text-amber-500/70">Impedance Pneumography</span>
                    </div>
                    <span className="text-[11px] font-bold">16 RPM</span>
                  </div>
                  <div className="h-16 w-full relative">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#451a03_1px,transparent_1px),linear-gradient(to_bottom,#451a03_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none" />
                    <canvas ref={modalRespCanvasRef} width={680} height={64} className="w-full h-full block relative z-10" />
                  </div>
                </div>
              </div>

              {/* Digital Parameter Readout Column (1/4 width - Right Bedside Box) */}
              <div className="space-y-3 flex flex-col justify-between">
                {/* Heart Rate Readout */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">HR (ECG)</span>
                  <div className="text-4xl font-extrabold text-emerald-400 tracking-tight flex items-baseline gap-2">
                    <span>{bpm}</span>
                    <Heart
                      className={`w-4 h-4 text-emerald-400 inline transition-transform duration-150 ${
                        isBeating ? "scale-130 fill-emerald-400" : "scale-100"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-emerald-500/70">Sinus Rhythm • 60-100</span>
                </div>

                {/* Blood Pressure Readout */}
                <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">NIBP / ART (mmHg)</span>
                  <div className="text-3xl font-extrabold text-cyan-400 tracking-tight">
                    {systolic}/{diastolic}
                  </div>
                  <span className="text-[10px] text-cyan-500/70">MAP: ({mapValue}) mmHg</span>
                </div>

                {/* SpO2 Readout */}
                <div className="p-3.5 rounded-2xl bg-sky-950/20 border border-sky-500/30">
                  <span className="text-[10px] text-sky-400 uppercase tracking-widest font-bold">SpO2 (%)</span>
                  <div className="text-3xl font-extrabold text-sky-400 tracking-tight">
                    {spo2}%
                  </div>
                  <span className="text-[10px] text-sky-500/70">Pulse: {bpm} • PI: 4.2%</span>
                </div>

                {/* Respiration Readout */}
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">RESP (rpm)</span>
                  <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
                    16
                  </div>
                  <span className="text-[10px] text-amber-500/70">Normal Eupnea</span>
                </div>
              </div>
            </div>

            {/* Footer Telemetry Metadata */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[10px] text-slate-500">
              <span>ZERO-KNOWLEDGE CIPHER ATTESTED • ENCLAVE NITRO v2.4 • BLE 5.3 FREQ 2.4GHz</span>
              <span>BATTERY: 98% • ELECTRODE IMPEDANCE: 1.2 kΩ (OPTIMAL)</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
