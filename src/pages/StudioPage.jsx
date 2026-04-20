import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Play, Pause, Scissors, RotateCcw, Download, Upload, Volume2 } from 'lucide-react';

/* ── Audio Helpers ── */
function drawWaveform(canvas, audioBuffer, startPct = 0, endPct = 1, playheadPct = -1) {
  if (!canvas || !audioBuffer) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const data = audioBuffer.getChannelData(0);
  const samples = data.length;

  ctx.clearRect(0, 0, width, height);

  // Draw waveform
  const step = Math.ceil(samples / width);
  const mid = height / 2;

  for (let i = 0; i < width; i++) {
    const sampleIdx = Math.floor(i * samples / width);
    let min = 1, max = -1;
    for (let j = 0; j < step && sampleIdx + j < samples; j++) {
      const val = data[sampleIdx + j];
      if (val < min) min = val;
      if (val > max) max = val;
    }

    const pct = i / width;
    const inSelection = pct >= startPct && pct <= endPct;

    ctx.fillStyle = inSelection ? '#ff6b9d' : '#3a3a4a';
    ctx.fillRect(i, mid - max * mid, 1, (max - min) * mid);
  }

  // Trim handles
  if (startPct > 0 || endPct < 1) {
    ctx.fillStyle = 'rgba(255, 107, 157, 0.15)';
    ctx.fillRect(0, 0, startPct * width, height);
    ctx.fillRect(endPct * width, 0, width - endPct * width, height);

    ctx.strokeStyle = '#ff6b9d';
    ctx.lineWidth = 2;
    [startPct * width, endPct * width].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });
  }

  // Playhead
  if (playheadPct >= 0) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadPct * width, 0);
    ctx.lineTo(playheadPct * width, height);
    ctx.stroke();
  }
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const data = numChannels === 1 ? buffer.getChannelData(0) : interleave(buffer);
  const dataLength = data.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function interleave(buffer) {
  const ch0 = buffer.getChannelData(0);
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : ch0;
  const result = new Float32Array(ch0.length + ch1.length);
  for (let i = 0; i < ch0.length; i++) {
    result[i * 2] = ch0[i];
    result[i * 2 + 1] = ch1[i];
  }
  return result;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

async function applyEffects(audioBuffer, effects) {
  const ctx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  let node = source;

  // EQ
  if (effects.eqLow !== 0 || effects.eqMid !== 0 || effects.eqHigh !== 0) {
    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 320;
    low.gain.value = effects.eqLow;

    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 0.5;
    mid.gain.value = effects.eqMid;

    const high = ctx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 3200;
    high.gain.value = effects.eqHigh;

    node.connect(low);
    low.connect(mid);
    mid.connect(high);
    node = high;
  }

  // Reverb
  if (effects.reverb > 0) {
    const convolver = ctx.createConvolver();
    const impulseLength = ctx.sampleRate * 2;
    const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < impulseLength; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
      }
    }
    convolver.buffer = impulse;

    const dryGain = ctx.createGain();
    dryGain.gain.value = 1 - effects.reverb * 0.5;
    const wetGain = ctx.createGain();
    wetGain.gain.value = effects.reverb;

    const merger = ctx.createGain();
    node.connect(dryGain);
    node.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(merger);
    wetGain.connect(merger);
    node = merger;
  }

  // Delay/Echo
  if (effects.delay > 0) {
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.3;
    const feedback = ctx.createGain();
    feedback.gain.value = effects.delay * 0.6;
    const dryGain = ctx.createGain();
    dryGain.gain.value = 1;
    const wetGain = ctx.createGain();
    wetGain.gain.value = effects.delay * 0.5;

    const merger = ctx.createGain();
    node.connect(dryGain);
    node.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);
    dryGain.connect(merger);
    wetGain.connect(merger);
    node = merger;
  }

  node.connect(ctx.destination);
  source.start(0);
  return await ctx.startRendering();
}

function trimBuffer(buffer, startPct, endPct) {
  const startSample = Math.floor(buffer.length * startPct);
  const endSample = Math.floor(buffer.length * endPct);
  const length = endSample - startSample;

  const ctx = new OfflineAudioContext(buffer.numberOfChannels, length, buffer.sampleRate);
  const newBuffer = ctx.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const oldData = buffer.getChannelData(ch);
    const newData = newBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      newData[i] = oldData[startSample + i];
    }
  }

  return newBuffer;
}

/* ── STUDIO COMPONENT ── */
export default function StudioPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const playbackAudioRef = useRef(null);
  const animFrameRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [processedBuffer, setProcessedBuffer] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('record');

  const [effects, setEffects] = useState({
    reverb: 0,
    delay: 0,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
  });

  // Redraw waveform
  useEffect(() => {
    const buf = processedBuffer || audioBuffer;
    if (canvasRef.current && buf) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      drawWaveform(canvas, buf, trimStart, trimEnd);
    }
  }, [audioBuffer, processedBuffer, trimStart, trimEnd]);

  // Record timer
  useEffect(() => {
    if (!recording) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setRecordTime((Date.now() - start) / 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [recording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        const audioCtx = new AudioContext();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        setAudioBuffer(decoded);
        setProcessedBuffer(null);
        setRecorded(true);
        setTrimStart(0);
        setTrimEnd(1);
        setActiveTab('edit');
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordTime(0);
    } catch (err) {
      alert('Microphone access denied. Please allow microphone access to record.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const loadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const audioCtx = new AudioContext();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    setAudioBuffer(decoded);
    setProcessedBuffer(null);
    setRecorded(true);
    setTrimStart(0);
    setTrimEnd(1);
    setActiveTab('edit');
  };

  const playPreview = () => {
    const buf = processedBuffer || audioBuffer;
    if (!buf) return;

    if (playing) {
      playbackAudioRef.current?.stop();
      setPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const audioCtx = new AudioContext();
    const source = audioCtx.createBufferSource();
    source.buffer = buf;
    source.connect(audioCtx.destination);

    const startTime = buf.duration * trimStart;
    const duration = buf.duration * (trimEnd - trimStart);
    source.start(0, startTime, duration);
    playbackAudioRef.current = source;
    setPlaying(true);

    // Animate playhead
    const startMs = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - startMs) / 1000;
      const pct = trimStart + (elapsed / buf.duration) * (trimEnd - trimStart) / (duration / buf.duration);
      if (canvasRef.current && buf) {
        const canvas = canvasRef.current;
        drawWaveform(canvas, buf, trimStart, trimEnd, Math.min(pct, trimEnd));
      }
      if (elapsed < duration) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);

    source.onended = () => {
      setPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
      if (canvasRef.current && buf) {
        drawWaveform(canvasRef.current, buf, trimStart, trimEnd);
      }
    };
  };

  const handleApplyEffects = async () => {
    if (!audioBuffer) return;
    setProcessing(true);
    try {
      let buf = audioBuffer;
      // Trim first
      if (trimStart > 0 || trimEnd < 1) {
        buf = trimBuffer(buf, trimStart, trimEnd);
      }
      // Apply effects
      const hasEffects = Object.values(effects).some(v => v !== 0);
      if (hasEffects) {
        buf = await applyEffects(buf, effects);
      }
      setProcessedBuffer(buf);
    } catch (err) {
      console.error('Effect processing error:', err);
    }
    setProcessing(false);
  };

  const handleExport = () => {
    const buf = processedBuffer || audioBuffer;
    if (!buf) return;

    const finalBuf = (!processedBuffer && (trimStart > 0 || trimEnd < 1))
      ? trimBuffer(buf, trimStart, trimEnd) : buf;
    const wav = audioBufferToWav(finalBuf);
    const url = URL.createObjectURL(wav);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kinify-recording.wav';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    const buf = processedBuffer || audioBuffer;
    if (!buf) return;

    const finalBuf = (!processedBuffer && (trimStart > 0 || trimEnd < 1))
      ? trimBuffer(buf, trimStart, trimEnd) : buf;
    const wav = audioBufferToWav(finalBuf);

    // Store blob for upload page
    sessionStorage.setItem('kinify_studio_recording', 'true');
    window.__kinify_recording_blob = wav;
    navigate('/upload?from=studio');
  };

  const resetStudio = () => {
    setAudioBuffer(null);
    setProcessedBuffer(null);
    setRecorded(false);
    setRecording(false);
    setPlaying(false);
    setTrimStart(0);
    setTrimEnd(1);
    setEffects({ reverb: 0, delay: 0, eqLow: 0, eqMid: 0, eqHigh: 0 });
    setActiveTab('record');
  };

  const handleCanvasClick = (e) => {
    if (!canvasRef.current || !audioBuffer) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;

    // Set trim handle closest to click
    const distStart = Math.abs(x - trimStart);
    const distEnd = Math.abs(x - trimEnd);
    if (distStart < distEnd) {
      setTrimStart(Math.max(0, Math.min(x, trimEnd - 0.01)));
    } else {
      setTrimEnd(Math.max(trimStart + 0.01, Math.min(x, 1)));
    }
  };

  const formatRecordTime = (t) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="studio-page">
      <h1 className="page-title">Recording Studio</h1>

      {/* Tabs */}
      <div className="studio-tabs">
        <button onClick={() => setActiveTab('record')} className={`studio-tab ${activeTab === 'record' ? 'active' : ''}`}>
          <Mic size={16} /> Record
        </button>
        <button onClick={() => setActiveTab('edit')} className={`studio-tab ${activeTab === 'edit' ? 'active' : ''}`} disabled={!recorded}>
          <Scissors size={16} /> Edit
        </button>
        <button onClick={() => setActiveTab('effects')} className={`studio-tab ${activeTab === 'effects' ? 'active' : ''}`} disabled={!recorded}>
          <Volume2 size={16} /> Effects
        </button>
      </div>

      {/* Record Tab */}
      {activeTab === 'record' && (
        <div className="studio-record">
          <div className="record-circle-wrap">
            <button
              onClick={recording ? stopRecording : startRecording}
              className={`record-btn ${recording ? 'recording' : ''}`}
            >
              {recording ? <Square size={32} /> : <Mic size={40} />}
            </button>
            {recording && <div className="record-pulse" />}
          </div>
          <p className="record-time">{formatRecordTime(recordTime)}</p>
          <p className="record-hint">{recording ? 'Tap to stop' : 'Tap to record'}</p>

          <div className="studio-divider"><span>or</span></div>

          <label className="btn-ghost studio-import-btn">
            <Upload size={18} /> Import Audio File
            <input type="file" accept="audio/*" onChange={loadFile} hidden />
          </label>
        </div>
      )}

      {/* Edit Tab */}
      {activeTab === 'edit' && recorded && (
        <div className="studio-edit">
          {/* Waveform */}
          <div className="waveform-container">
            <canvas ref={canvasRef} className="waveform-canvas" onClick={handleCanvasClick} />
          </div>

          {/* Trim controls */}
          <div className="trim-controls">
            <div className="trim-slider-group">
              <label>Start</label>
              <input type="range" min="0" max="0.99" step="0.01" value={trimStart}
                onChange={(e) => setTrimStart(Math.min(Number(e.target.value), trimEnd - 0.01))} className="trim-slider" />
              <span>{Math.round(trimStart * 100)}%</span>
            </div>
            <div className="trim-slider-group">
              <label>End</label>
              <input type="range" min="0.01" max="1" step="0.01" value={trimEnd}
                onChange={(e) => setTrimEnd(Math.max(Number(e.target.value), trimStart + 0.01))} className="trim-slider" />
              <span>{Math.round(trimEnd * 100)}%</span>
            </div>
          </div>

          {/* Playback */}
          <div className="studio-actions">
            <button onClick={playPreview} className="btn-primary">
              {playing ? <><Pause size={18} /> Stop</> : <><Play size={18} /> Preview</>}
            </button>
            <button onClick={resetStudio} className="btn-ghost">
              <RotateCcw size={18} /> Reset
            </button>
          </div>
        </div>
      )}

      {/* Effects Tab */}
      {activeTab === 'effects' && recorded && (
        <div className="studio-effects">
          <div className="effect-group">
            <label>Reverb <span className="effect-value">{Math.round(effects.reverb * 100)}%</span></label>
            <input type="range" min="0" max="1" step="0.05" value={effects.reverb}
              onChange={(e) => setEffects(f => ({ ...f, reverb: Number(e.target.value) }))} className="effect-slider" />
          </div>
          <div className="effect-group">
            <label>Echo / Delay <span className="effect-value">{Math.round(effects.delay * 100)}%</span></label>
            <input type="range" min="0" max="1" step="0.05" value={effects.delay}
              onChange={(e) => setEffects(f => ({ ...f, delay: Number(e.target.value) }))} className="effect-slider" />
          </div>
          <div className="effect-group">
            <label>Bass <span className="effect-value">{effects.eqLow > 0 ? '+' : ''}{effects.eqLow}dB</span></label>
            <input type="range" min="-12" max="12" step="1" value={effects.eqLow}
              onChange={(e) => setEffects(f => ({ ...f, eqLow: Number(e.target.value) }))} className="effect-slider" />
          </div>
          <div className="effect-group">
            <label>Mids <span className="effect-value">{effects.eqMid > 0 ? '+' : ''}{effects.eqMid}dB</span></label>
            <input type="range" min="-12" max="12" step="1" value={effects.eqMid}
              onChange={(e) => setEffects(f => ({ ...f, eqMid: Number(e.target.value) }))} className="effect-slider" />
          </div>
          <div className="effect-group">
            <label>Treble <span className="effect-value">{effects.eqHigh > 0 ? '+' : ''}{effects.eqHigh}dB</span></label>
            <input type="range" min="-12" max="12" step="1" value={effects.eqHigh}
              onChange={(e) => setEffects(f => ({ ...f, eqHigh: Number(e.target.value) }))} className="effect-slider" />
          </div>

          <div className="studio-actions">
            <button onClick={handleApplyEffects} className="btn-primary" disabled={processing}>
              {processing ? <div className="loader-spinner small" /> : 'Apply Effects'}
            </button>
            <button onClick={() => { setEffects({ reverb: 0, delay: 0, eqLow: 0, eqMid: 0, eqHigh: 0 }); setProcessedBuffer(null); }} className="btn-ghost">
              Reset Effects
            </button>
          </div>

          {/* Waveform preview after effects */}
          {processedBuffer && (
            <div className="waveform-container mt-4">
              <canvas ref={canvasRef} className="waveform-canvas" />
              <p className="text-center text-muted text-sm mt-2">Effects applied ✓</p>
            </div>
          )}
        </div>
      )}

      {/* Export Actions (always visible when recorded) */}
      {recorded && (
        <div className="studio-export">
          <h3>Export</h3>
          <div className="studio-export-actions">
            <button onClick={handleExport} className="btn-ghost">
              <Download size={18} /> Download WAV
            </button>
            <button onClick={handleUpload} className="btn-primary">
              <Upload size={18} /> Upload to Kinify
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
