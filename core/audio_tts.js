/**
 * core/audio_tts.js
 * Handles msedge-tts WordBoundary parsing, keyword beat anchoring,
 * pure-Node warm chord synthesizer (Cmaj9->Am9->Fmaj9->G6), FFmpeg -15 LUFS mixing, & SFX cues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

function inferVoiceLocale(voice, lang) {
  if (typeof voice === 'string' && /^[a-z]{2}-[A-Z]{2}/.test(voice)) return voice.slice(0, 5);
  if (lang === 'en') return 'en-IN';
  return 'kn-IN';
}

function parseBoundaryObjects(rawChunks) {
  const raw = rawChunks.join('');
  const words = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try {
          const obj = JSON.parse(raw.slice(start, i + 1));
          for (const item of obj.Metadata || []) {
            if (item.Type === 'WordBoundary' && item.Data?.text?.Text) {
              const offsetSec = Number(item.Data.Offset || 0) / 10_000_000;
              const durSec = Math.max(0.08, Number(item.Data.Duration || 0) / 10_000_000);
              words.push({
                text: String(item.Data.text.Text).trim(),
                start: Number(offsetSec.toFixed(3)),
                end: Number((offsetSec + durSec).toFixed(3))
              });
            }
          }
        } catch {}
        start = -1;
      }
    }
  }
  return words;
}

function findAnchorTime(wordTimings, candidateKeywords, fallbackSec, minSec, maxSec) {
  if (!Array.isArray(wordTimings) || wordTimings.length === 0 || !candidateKeywords?.length) return fallbackSec;
  for (const kw of candidateKeywords) {
    const needle = String(kw).toLowerCase();
    if (needle.length < 2) continue;
    const match = wordTimings.find((w) => w.text.toLowerCase().includes(needle) && w.start >= minSec - 0.5 && w.start <= maxSec);
    if (match) return Math.max(minSec, Math.min(maxSec, match.start - 0.12));
  }
  return fallbackSec;
}

function inferKeywordsForBeat(beat) {
  const keys = new Set();
  const txt = `${beat.widget || ''} ${beat.badge || ''} ${beat.value || ''} ${beat.count_to || ''} ${beat.width_label || ''} ${beat.depth_label || ''} ${beat.route_end || ''} ${(beat.items || []).join(' ')}`.toLowerCase();
  const nums = txt.match(/\d[\d.,]*/g) || [];
  nums.forEach((n) => keys.add(n.replace(/,/g, '')));

  if (txt.includes('highway') || txt.includes('road') || beat.widget === 'route_tracker') {
    ['ಹೆದ್ದಾರಿ', 'ರಸ್ತೆ', 'highway', 'road', 'meters', 'ಮೀಟರ್', 'ಕಿಲೋಮೀಟರ್'].forEach((k) => keys.add(k));
  }
  if (txt.includes('tuda') || txt.includes('rera') || txt.includes('katha') || txt.includes('khata') || beat.widget === 'verified_shield') {
    ['ಟುಡಾ', 'tuda', 'ಖಾತಾ', 'khata', 'rera', 'ಅಪ್ರೂವ್', 'approved', 'ಟೈಟಲ್', 'title'].forEach((k) => keys.add(k));
  }
  if (beat.widget === 'checklist_live') {
    ['ನೀರು', 'ನೀರಿನ', 'ವಿದ್ಯುತ್', 'ಬೋರ್', 'ರಸ್ತೆ', 'water', 'power', 'park'].forEach((k) => keys.add(k));
  }
  if (beat.widget === 'blueprint_draw') {
    ['ಅಳತೆ', 'ಚದರಡಿ', 'ವಿಸ್ತೀರ್ಣ', 'dimension', 'sq.ft'].forEach((k) => keys.add(k));
  }
  if (beat.widget === 'vastu_compass') {
    ['ವಾಸ್ತು', 'ಪೂರ್ವ', 'ಉತ್ತರ', 'vastu', 'east', 'north', 'facing'].forEach((k) => keys.add(k));
  }
  if (beat.widget === 'price_odometer' || beat.widget === 'price_calc') {
    ['ಬೆಲೆ', 'ರೂಪಾಯಿ', 'ಲಕ್ಷ', 'ಕೋಟಿ', 'ಚದರಡಿ', 'price', 'lakhs', 'rupees'].forEach((k) => keys.add(k));
  }
  if (beat.widget === 'follow_cta' || beat.widget === 'interactive_cta') {
    ['ಫಾಲೋ', 'ಪೇಜ್', 'ಕರೆ', 'ಭೇಟಿ', 'follow', 'page', 'visit', 'call'].forEach((k) => keys.add(k));
  }
  return Array.from(keys);
}

function synthesizeAmbientBedWav(durationSec, outWavPath, sampleRate = 48000) {
  const nSamples = Math.max(sampleRate, Math.ceil(durationSec * sampleRate));
  const left = new Float64Array(nSamples);
  const right = new Float64Array(nSamples);

  const chords = [
    [130.81, 196.0, 246.94, 293.66, 329.63], // Cmaj9
    [110.0, 196.0, 246.94, 261.63, 329.63],  // Am9
    [174.61, 220.0, 261.63, 329.63, 392.0],  // Fmaj9
    [196.0, 246.94, 293.66, 329.63, 440.0]   // G6
  ];
  const barSec = 8.0;
  const xfadeSec = 2.2;
  const twoPi = 2.0 * Math.PI;
  const totalBars = Math.ceil(durationSec / barSec) + 1;

  for (let barIdx = 0; barIdx < totalBars; barIdx++) {
    const startS = barIdx * barSec;
    const endS = startS + barSec + xfadeSec;
    const i0 = Math.max(0, Math.floor(startS * sampleRate));
    const i1 = Math.min(nSamples, Math.floor(endS * sampleRate));
    if (i0 >= i1) continue;

    const segLen = endS - startS;
    const freqs = chords[barIdx % chords.length];

    for (let i = i0; i < i1; i++) {
      const segT = i / sampleRate;
      const localT = segT - startS;
      let env = 1.0;
      if (localT < xfadeSec) env = 0.5 * (1.0 - Math.cos((Math.PI * localT) / xfadeSec));
      else if (localT > segLen - xfadeSec) env = 0.5 * (1.0 + Math.cos((Math.PI * (localT - (segLen - xfadeSec))) / xfadeSec));

      const breath = 0.85 + 0.15 * Math.sin(twoPi * 0.25 * localT);
      let padL = 0;
      let padR = 0;
      for (let k = 0; k < freqs.length; k++) {
        const f = freqs[k];
        const detune = 0.35 + 0.08 * k;
        const w = 1.0 / (1.0 + 0.25 * k);
        padL += w * Math.sin(twoPi * (f - detune) * segT);
        padR += w * Math.sin(twoPi * (f + detune) * segT);
      }
      left[i] += (padL / freqs.length) * env * breath;
      right[i] += (padR / freqs.length) * env * breath;
    }
  }

  const pulseInterval = 2.0;
  const numPulses = Math.floor(durationSec / pulseInterval);
  const melodyDegrees = [4, 2, 3, 1];
  for (let pIdx = 0; pIdx < numPulses; pIdx++) {
    const pTime = pIdx * pulseInterval + 0.15;
    const barIdx = Math.floor(pTime / barSec);
    const freqs = chords[barIdx % chords.length];
    const noteF = freqs[melodyDegrees[pIdx % melodyDegrees.length] % freqs.length] * 2.0;
    const pDur = 2.4;
    const i0 = Math.max(0, Math.floor(pTime * sampleRate));
    const i1 = Math.min(nSamples, Math.floor((pTime + pDur) * sampleRate));
    const pan = pIdx % 2 === 0 ? 0.35 : 0.65;
    for (let i = i0; i < i1; i++) {
      const pt = i / sampleRate - pTime;
      const tone = (1.0 - Math.exp(-pt / 0.03)) * Math.exp(-pt / 0.9) * (Math.sin(twoPi * noteF * pt) + 0.18 * Math.sin(twoPi * 2.0 * noteF * pt));
      left[i] += 0.28 * (1.0 - pan) * tone;
      right[i] += 0.28 * pan * tone;
    }
  }

  const fadeSamples = Math.min(Math.floor(nSamples / 4), Math.floor(1.8 * sampleRate));
  for (let i = 0; i < fadeSamples; i++) {
    const rIn = i / fadeSamples;
    const rOut = 1.0 - i / fadeSamples;
    left[i] *= rIn;
    right[i] *= rIn;
    left[nSamples - fadeSamples + i] *= rOut;
    right[nSamples - fadeSamples + i] *= rOut;
  }

  let peak = 1e-6;
  for (let i = 0; i < nSamples; i++) {
    const al = Math.abs(left[i]);
    const ar = Math.abs(right[i]);
    if (al > peak) peak = al;
    if (ar > peak) peak = ar;
  }
  const scale = (0.18 / peak) * 32767.0;
  const dataByteLen = nSamples * 4;
  const buf = Buffer.allocUnsafe(44 + dataByteLen);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataByteLen, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataByteLen, 40);

  let offset = 44;
  for (let i = 0; i < nSamples; i++) {
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(left[i] * scale))), offset);
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(right[i] * scale))), offset + 2);
    offset += 4;
  }
  fs.mkdirSync(path.dirname(outWavPath), { recursive: true });
  fs.writeFileSync(outWavPath, buf);
}

function mixMasterAudio({ ffmpegExe, audioScenes, totalDurationSec, voiceOnlyPath, masterAudioPath, ambientWavPath, customMusicPath, enableMusic }) {
  let inputs = `-f lavfi -i anullsrc=r=48000:cl=stereo:d=${totalDurationSec} `;
  const filters = [];
  let mixInputs = '[0:a]';
  audioScenes.forEach((sc, idx) => {
    inputs += `-i "${sc.absAudioPath}" `;
    const d = sc.audioDelayMs;
    filters.push(`[${idx + 1}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,adelay=${d}|${d}[a${idx}]`);
    mixInputs += `[a${idx}]`;
  });
  const filterComplex = `${filters.join('; ')}; ${mixInputs}amix=inputs=${audioScenes.length + 1}:duration=first:normalize=0[aout]`;
  execSync(`"${ffmpegExe}" ${inputs} -filter_complex "${filterComplex}" -map "[aout]" -c:a libmp3lame -b:a 192k "${voiceOnlyPath}" -y`, { stdio: 'ignore' });

  if (enableMusic) {
    let bedInput = customMusicPath;
    if (!bedInput) {
      synthesizeAmbientBedWav(totalDurationSec, ambientWavPath);
      bedInput = ambientWavPath;
    }
    if (fs.existsSync(bedInput)) {
      const mixFilter =
        '[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=1.18[voice];' +
        '[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=0.22[music];' +
        '[voice][music]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11[final]';
      execSync(`"${ffmpegExe}" -i "${voiceOnlyPath}" -i "${bedInput}" -filter_complex "${mixFilter}" -map "[final]" -c:a libmp3lame -b:a 192k "${masterAudioPath}" -y`, { stdio: 'ignore' });
      return;
    }
  }
  fs.copyFileSync(voiceOnlyPath, masterAudioPath);
}

function buildSfxSchedule(timelineData) {
  const cues = [];
  const scenes = timelineData.scenes;
  for (let i = 1; i < scenes.length; i++) {
    const file = i % 2 === 1 ? 'assets/sfx/whoosh-short.mp3' : 'assets/sfx/whoosh.mp3';
    cues.push({ id: `sfx-cut-${i}`, track: 5, src: file, start: Math.max(0.05, scenes[i].startSec - 0.08), dur: 0.56, vol: 0.28 });
  }
  let lastTrack6End = -1;
  scenes.forEach((sc, i) => {
    sc.beats.forEach((b, bi) => {
      const globalBeatStart = sc.startSec + b.startSec;
      let item = null;
      if (b.widget === 'price_odometer') {
        item = { id: `sfx-price-${i}`, track: 6, src: 'assets/sfx/impact-bass-1.mp3', start: globalBeatStart + 0.04, dur: 1.8, vol: 0.30 };
      } else if (b.widget === 'verified_shield') {
        item = { id: `sfx-shield-${i}`, track: 6, src: 'assets/sfx/chime.mp3', start: globalBeatStart + 0.18, dur: 2.2, vol: 0.26 };
      } else if (b.widget === 'follow_cta' || b.widget === 'interactive_cta') {
        const tapAt = globalBeatStart + Math.min(1.8, (b.endSec - b.startSec) * 0.34);
        item = { id: `sfx-cta-${i}`, track: 6, src: 'assets/sfx/click.mp3', start: tapAt + 0.03, dur: 0.36, vol: 0.34 };
      } else if (b.widget === 'vastu_compass') {
        item = { id: `sfx-ping-${i}`, track: 6, src: 'assets/sfx/ping.mp3', start: globalBeatStart + 0.20, dur: 1.2, vol: 0.24 };
      } else if (bi === 0 && i > 0) {
        item = { id: `sfx-pop-${i}`, track: 6, src: 'assets/sfx/pop.mp3', start: globalBeatStart + 0.12, dur: 0.65, vol: 0.24 };
      }
      if (item && item.start > lastTrack6End + 0.1) {
        cues.push(item);
        lastTrack6End = item.start + item.dur;
      }
    });
  });
  return cues;
}

async function synthesizeSpeechFile({ text, outPath, voice, locale, rate = '+2%', pitch = '+0Hz', maxRetries = 3, timeoutMs = 25000 }) {
  const ttsFormat = OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3 || OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;
  let lastErr = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(voice, ttsFormat, { voiceLocale: locale, wordBoundaryEnabled: true, sentenceBoundaryEnabled: true });
      const metaChunks = [];
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`TTS timed out after ${timeoutMs}ms`)), timeoutMs);
        const fileStream = fs.createWriteStream(outPath);
        const { audioStream, metadataStream } = tts.toStream(text.trim(), { rate, pitch });
        if (metadataStream) {
          metadataStream.on('data', (chunk) => metaChunks.push(chunk.toString('utf8')));
          metadataStream.on('error', () => {});
        }
        audioStream.on('error', (e) => { clearTimeout(timer); reject(e); });
        fileStream.on('error', (e) => { clearTimeout(timer); reject(e); });
        fileStream.on('finish', () => { clearTimeout(timer); resolve(); });
        audioStream.pipe(fileStream);
      });
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 800) {
        return parseBoundaryObjects(metaChunks);
      }
      throw new Error('Empty TTS audio stream produced');
    } catch (err) {
      lastErr = err;
      try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 600 * attempt));
    } finally {
      try { tts.close(); } catch {}
    }
  }
  throw lastErr || new Error('Failed to synthesize TTS speech');
}

module.exports = {
  inferVoiceLocale,
  parseBoundaryObjects,
  synthesizeSpeechFile,
  findAnchorTime,
  inferKeywordsForBeat,
  synthesizeAmbientBedWav,
  mixMasterAudio,
  buildSfxSchedule
};
