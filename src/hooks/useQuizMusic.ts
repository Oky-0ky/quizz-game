'use client';

import { useEffect, useRef } from 'react';

/**
 * useQuizMusic
 * ------------
 * Memutar musik latar secara loop selama sesi quiz aktif.
 * Musik "direndem" (di-random) tiap mulai: pitch/tempo dasar diacak
 * sehingga nuansa berbeda setiap kali quiz dimulai.
 *
 * Implementasi pakai Web Audio API — tanpa file audio fisik, jadi
 * tidak perlu menambahkan aset mp3 apa pun ke folder public/.
 */

interface QuizMusicOptions {
  /** Aktif ketika ada pertanyaan aktif (quiz sedang berlangsung). */
  playing: boolean;
  /** Volume master 0-1 (default 0.18 supaya tidak berlebihan). */
  volume?: number;
}

export function useQuizMusic({ playing, volume = 0.18 }: QuizMusicOptions) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!playing) {
      stopRef.current?.();
      stopRef.current = null;
      return;
    }

    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      void ctx.resume();

      // ---- Randomisasi ("rendem") per sesi ----
      // Skala pentatonis acak + nada dasar acak + tempo acak
      const scales = [
        [0, 2, 4, 7, 9], // major pentatonic
        [0, 3, 5, 7, 10], // minor pentatonic
        [0, 2, 3, 5, 7], // hirajoshi-ish
        [0, 1, 5, 7, 8], // in-sen-ish
      ];
      const scale = scales[Math.floor(Math.random() * scales.length)];
      const rootFreq = 180 * Math.pow(2, Math.floor(Math.random() * 7) / 12);
      const beatSec = 0.28 + Math.random() * 0.2; // tempo acak ~100-140 BPM
      const filterCutoff = 900 + Math.random() * 900;
      const waveforms: OscillatorType[] = ['triangle', 'sine', 'square'];
      const leadWave = waveforms[Math.floor(Math.random() * waveforms.length)];

      const master = ctx.createGain();
      master.gain.value = volume;
      const lpFilter = ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.value = filterCutoff;
      master.connect(lpFilter);
      lpFilter.connect(ctx.destination);

      const midiToFreq = (semi: number) => rootFreq * Math.pow(2, semi / 12);

      // Bass berulang tiap 2 beat
      const bassStep = () => {
        if (cancelled) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        const deg = scale[Math.floor(Math.random() * scale.length)] - 12;
        o.frequency.value = midiToFreq(deg);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + beatSec * 2);
        o.connect(g).connect(master);
        o.start();
        o.stop(ctx.currentTime + beatSec * 2);
        bassTimer = window.setTimeout(bassStep, beatSec * 2 * 1000);
      };

      // Melodi arpeggio tiap 1/2 beat
      const melodyStep = () => {
        if (cancelled) return;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = leadWave;
        const deg = scale[Math.floor(Math.random() * scale.length)] + (Math.random() < 0.3 ? 12 : 0);
        o.frequency.value = midiToFreq(deg);
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + beatSec * 0.9);
        o.connect(g).connect(master);
        o.start();
        o.stop(ctx.currentTime + beatSec);
        melodyTimer = window.setTimeout(melodyStep, beatSec * 0.5 * 1000);
      };

      // Hi-hat sintetis tiap 1/2 beat (noise burst pendek)
      const hatStep = () => {
        if (cancelled) return;
        const bufSize = 4096;
        const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 6000;
        const hg = ctx.createGain();
        hg.gain.value = 0.05;
        src.connect(hp).connect(hg).connect(master);
        src.start();
        hatTimer = window.setTimeout(hatStep, beatSec * 0.5 * 1000);
      };

      let bassTimer = 0;
      let melodyTimer = 0;
      let hatTimer = 0;
      bassStep();
      melodyStep();
      hatStep();

      stopRef.current = () => {
        cancelled = true;
        clearTimeout(bassTimer);
        clearTimeout(melodyTimer);
        clearTimeout(hatTimer);
        try {
          master.disconnect();
          lpFilter.disconnect();
        } catch {
          /* ignore */
        }
      };
    };

    // Autoplay policy: kalau AudioContext sudah 'running' (pengguna sudah
    // pernah berinteraksi, mis. klik tombol untuk buka modal soal), langsung
    // mulai. Kalau masih 'suspended', tunggu interaksi pertama.
    const cleanup = () => {
      cancelled = true;
      stopRef.current?.();
      stopRef.current = null;
    };
    if (typeof document !== 'undefined') {
      const kickoff = () => {
        start();
        document.removeEventListener('pointerdown', kickoff);
        document.removeEventListener('keydown', kickoff);
      };
      const probeCtx = new AudioContext();
      audioCtxRef.current = probeCtx;
      if (probeCtx.state === 'running') {
        void probeCtx.close().catch(() => { });
        audioCtxRef.current = null;
        start();
        return cleanup;
      }
      void probeCtx.close().catch(() => { });
      document.addEventListener('pointerdown', kickoff);
      document.addEventListener('keydown', kickoff);
      return () => {
        document.removeEventListener('pointerdown', kickoff);
        document.removeEventListener('keydown', kickoff);
        cleanup();
      };
    }

    start();
    return () => {
      cancelled = true;
      stopRef.current?.();
      stopRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  return null;
}
