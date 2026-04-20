import React, { useRef, useEffect, useCallback } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

export default function Visualizer({ width = 32, height = 16, barWidth = 2, gap = 1, color = '#ff6b9d' }) {
  const { getAnalyser, isPlaying } = usePlayer();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const dataRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const analyser = getAnalyser?.();

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const numBars = Math.floor(width / (barWidth + gap));

    if (analyser && isPlaying) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataRef.current);

      const step = Math.max(1, Math.floor(dataRef.current.length / numBars));

      for (let i = 0; i < numBars; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataRef.current[i * step + j] || 0;
        }
        const val = sum / step;
        const barHeight = Math.max(1, (val / 255) * height);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(
          i * (barWidth + gap),
          height - barHeight,
          barWidth,
          barHeight,
          barWidth / 2
        );
        ctx.fill();
      }
    } else if (isPlaying) {
      // Fallback: synthetic animation when analyser isn't available yet
      const t = performance.now() / 1000;
      for (let i = 0; i < numBars; i++) {
        const phase = (i / numBars) * Math.PI * 2;
        const val = 0.3 + 0.7 * Math.abs(Math.sin(t * 3 + phase));
        const barHeight = Math.max(1, val * height * 0.6);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(
          i * (barWidth + gap),
          height - barHeight,
          barWidth,
          barHeight,
          barWidth / 2
        );
        ctx.fill();
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, [getAnalyser, isPlaying, width, height, barWidth, gap, color]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', width, height }}
    />
  );
}
