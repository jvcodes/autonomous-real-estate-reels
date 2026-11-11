/**
 * core/resolve_xml.js
 * Native Final Cut Pro 7 / DaVinci Resolve FCP7 XML sequence generator.
 * Generates V1 raw clips, V2 ProRes 4444 alpha overlay (when present), A1 synced audio + markers.
 */

const fs = require('fs');
const path = require('path');

function escXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toFcpUrl(absPath) {
  let norm = absPath.replace(/\\/g, '/');
  if (norm.length >= 2 && norm[1] === ':') {
    norm = norm[0] + '%3a' + norm.slice(2);
  }
  return 'file://localhost/' + encodeURI(norm).replace(/%253a/i, '%3a');
}

function writeResolveXml(data, seqName, overlayPath, masterAudioPath, outXmlPath) {
  const fps = parseInt(data.fps || 30, 10);
  const w = parseInt(data.width || 1080, 10);
  const h = parseInt(data.height || 1920, 10);
  const totalFrames = parseInt(data.totalFrames, 10);

  const v1Clips = data.scenes
    .map(
      (s, idx) => `
        <clipitem id="hf-clip-v1-${idx + 1}">
          <name>${escXml(path.basename(s.absVideoPath))}</name>
          <duration>${s.durationFrames}</duration>
          <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
          <start>${s.startFrame}</start>
          <end>${s.endFrame}</end>
          <in>0</in>
          <out>${s.durationFrames}</out>
          <file id="hf-file-v1-${idx + 1}">
            <name>${escXml(path.basename(s.absVideoPath))}</name>
            <pathurl>${escXml(toFcpUrl(s.absVideoPath))}</pathurl>
            <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
            <duration>${s.durationFrames}</duration>
            <media><video><samplecharacteristics><width>${w}</width><height>${h}</height></samplecharacteristics></video></media>
          </file>
        </clipitem>`
    )
    .join('');

  const v2Track =
    overlayPath && fs.existsSync(overlayPath)
      ? `
      <track>
        <clipitem id="hf-clip-v2-overlay">
          <name>${escXml(path.basename(overlayPath))}</name>
          <duration>${totalFrames}</duration>
          <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
          <start>0</start>
          <end>${totalFrames}</end>
          <in>0</in>
          <out>${totalFrames}</out>
          <file id="hf-file-v2-overlay">
            <name>${escXml(path.basename(overlayPath))}</name>
            <pathurl>${escXml(toFcpUrl(overlayPath))}</pathurl>
            <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
            <duration>${totalFrames}</duration>
            <media><video><samplecharacteristics><width>${w}</width><height>${h}</height></samplecharacteristics></video></media>
          </file>
        </clipitem>
      </track>`
      : '';

  const a1Section =
    masterAudioPath && fs.existsSync(masterAudioPath)
      ? `
    <audio>
      <numOutputChannels>2</numOutputChannels>
      <format><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics></format>
      <track>
        <clipitem id="hf-clip-a1-audio">
          <name>${escXml(path.basename(masterAudioPath))}</name>
          <duration>${totalFrames}</duration>
          <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
          <start>0</start>
          <end>${totalFrames}</end>
          <in>0</in>
          <out>${totalFrames}</out>
          <file id="hf-file-a1-audio">
            <name>${escXml(path.basename(masterAudioPath))}</name>
            <pathurl>${escXml(toFcpUrl(masterAudioPath))}</pathurl>
            <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
            <duration>${totalFrames}</duration>
            <media><audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics><channelcount>2</channelcount></audio></media>
          </file>
          <sourcetrack><mediatype>audio</mediatype><trackindex>1</trackindex></sourcetrack>
        </clipitem>
      </track>
    </audio>`
      : '';

  const markers = data.scenes
    .map(
      (s) => `
    <marker>
      <name>${escXml(s.hero_value || s.id)}</name>
      <comment>${escXml(s.sub_value || '')}</comment>
      <in>${s.startFrame}</in>
      <out>-1</out>
    </marker>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <sequence id="sequence-reel-studio-1">
    <name>${escXml(seqName)}</name>
    <duration>${totalFrames}</duration>
    <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
    <timecode>
      <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
      <string>01:00:00:00</string>
      <frame>108000</frame>
      <displayformat>NDF</displayformat>
    </timecode>
    <media>
      <video>
        <format>
          <samplecharacteristics>
            <width>${w}</width>
            <height>${h}</height>
            <pixelaspectratio>square</pixelaspectratio>
            <rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>
            <anamorphic>FALSE</anamorphic>
          </samplecharacteristics>
        </format>
        <track>${v1Clips}
        </track>${v2Track}
      </video>${a1Section}
    </media>${markers}
  </sequence>
</xmeml>
`;
  fs.mkdirSync(path.dirname(outXmlPath), { recursive: true });
  fs.writeFileSync(outXmlPath, xml, 'utf8');
}

module.exports = { writeResolveXml };
