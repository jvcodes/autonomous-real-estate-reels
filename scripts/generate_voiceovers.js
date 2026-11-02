/**
 * Autonomous Voiceover Synthesizer for Tumkur Real Estate Reels
 * Generates natural regional voiceovers (English & Kannada) using Edge-TTS with ZERO token cost.
 */

const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'audio');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Script templates for each featured layout
const REEL_SCRIPTS = [
  {
    id: "01_PNK_Township",
    name: "P.N.K Township",
    rate: "1,950",
    road: "Vijayanagar Main Road",
    dist: "500 meters",
    landmark: "Behind Prasanna Dental Clinic, Ashok Nagar",
    enScript: "Looking for verified residential plots in Tumkur? Check out P.N.K Township on Vijayanagar Main Road! Just 500 meters from the highway, behind Prasanna Dental Clinic. Ready for registration with rates starting at only 1,950 rupees per square foot. Call now to book your site!",
    knScript: "ತುಮಕೂರಿನಲ್ಲಿ ಉತ್ತಮ ನಿವೇಶನ ಹುಡುಕುತ್ತಿದ್ದೀರಾ? ವಿಜಯನಗರ ಮೇನ್ ರೋಡ್ ಬಳಿಯ ಪಿ.ಎನ್.ಕೆ ಟೌನ್‌ಶಿಪ್ ಪರಿಶೀಲಿಸಿ! ಹೆದ್ದಾರಿಯಿಂದ ಕೇವಲ 500 ಮೀಟರ್. ಚದರಡಿಗೆ ಕೇವಲ 1,950 ರೂಪಾಯಿಗಳು ಮಾತ್ರ. ಇಂದೇ ಕರೆ ಮಾಡಿ!"
  },
  {
    id: "02_Batawadi_Junction",
    name: "Green Meadows Smart Township",
    rate: "1,850",
    road: "National Highway 48",
    dist: "300 meters",
    landmark: "Behind Batawadi Toll Plaza, Ring Road",
    enScript: "Prime investment alert in Tumkur! Green Meadows Smart Township at Batawadi Junction. Just 300 meters from NH 48 Ring Road! Fully developed layout with underground drainage, starting at just 1,850 rupees per square foot. Contact us today for a site visit!",
    knScript: "ತುಮಕೂರಿನ ಬಟವಾಡಿ ಜಂಕ್ಷನ್‌ನಲ್ಲಿ ಹೊಸ ಬಡಾವಣೆ! ಎನ್.ಎಚ್ 48 ರಿಂಗ್ ರೋಡ್‌ನಿಂದ ಕೇವಲ 300 ಮೀಟರ್ ದೂರದಲ್ಲಿದೆ. ಚದರಡಿಗೆ ಕೇವಲ 1,850 ರೂಪಾಯಿ. ಸೈಟ್ ವೀಕ್ಷಣೆಗೆ ಇಂದೇ ಸಂಪರ್ಕಿಸಿ!"
  },
  {
    id: "03_Kuvempunagara",
    name: "Royal Palms Elite Enclave",
    rate: "2,450",
    road: "B.H. Road",
    dist: "400 meters",
    landmark: "Opposite SIT Engineering College, Kuvempunagara",
    enScript: "Live in Tumkur's most prestigious neighborhood! Royal Palms Elite Enclave in Kuvempunagara, right opposite S.I.T College. Only 400 meters from B.H Road. BDA approved plots at 2,450 rupees per square foot. Limited plots available, inquire now!",
    knScript: "ತುಮಕೂರಿನ ಕುವೆಂಪುನಗರದಲ್ಲಿ ಐಷಾರಾಮಿ ನಿವೇಶನಗಳು! ಎಸ್.ಐ.ಟಿ ಕಾಲೇಜು ಮುಂಭಾಗ, ಬಿ.ಹೆಚ್ ರಸ್ತೆಗೆ ಕೇವಲ 400 ಮೀಟರ್. ಬೆಲೆ ಚದರಡಿಗೆ 2,450 ರೂಪಾಯಿ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗೆ ಸಂಪರ್ಕಿಸಿ!"
  },
  {
    id: "04_Amani_Lakeview",
    name: "Sri Balaji Anugraha",
    rate: "2,100",
    road: "Amani Kere Ring Road",
    dist: "600 meters",
    landmark: "Beside Tumkur Railway Station Link Road",
    enScript: "Wake up to serene lake views in Tumkur! Sri Balaji Anugraha near Amani Kere. Just 600 meters from the Railway Station link road. Clear titles, park facing sites at 2,100 rupees per square foot. Book your dream plot today!",
    knScript: "ತುಮಕೂರಿನ ಅಮಾನಿಕೆರೆ ಬಳಿ ಪ್ರಶಾಂತ ವಾತಾವರಣದ ನಿವೇಶನಗಳು! ರೈಲ್ವೆ ನಿಲ್ದಾಣದ ಲಿಂಕ್ ರಸ್ತೆಯಿಂದ ಕೇವಲ 600 ಮೀಟರ್. ಚದರಡಿಗೆ 2,100 ರೂಪಾಯಿ ಮಾತ್ರ. ಇಂದೇ ಭೇಟಿ ನೀಡಿ!"
  },
  {
    id: "05_Kyatsandra_Gateway",
    name: "Highway City Phase 2",
    rate: "2,600",
    road: "Bangalore-Tumkur Expressway",
    dist: "100 meters",
    landmark: "Next to Kyatsandra Toll Gate",
    enScript: "Unbeatable connectivity on Bangalore-Tumkur Expressway! Highway City Phase 2 at Kyatsandra. Just 100 meters from the expressway! Ideal for high-yield commercial and residential returns at 2,600 rupees per square foot. Call us immediately!",
    knScript: "ಬೆಂಗಳೂರು ತುಮಕೂರು ಎಕ್ಸ್‌ಪ್ರೆಸ್‌ವೇ ಪಕ್ಕದಲ್ಲೇ ಅದ್ಭುತ ನಿವೇಶನ! ಕ್ಯಾತ್ಸಂದ್ರ ಟೋಲ್ ಬಳಿ ಕೇವಲ 100 ಮೀಟರ್ ದೂರ. ಚದರಡಿಗೆ 2,600 ರೂಪಾಯಿ. ಇಂದೇ ಬುಕ್ ಮಾಡಿ!"
  }
];

async function generateVoiceovers() {
  console.log('====================================================');
  console.log('🎙️ Autonomous Voiceover Generation (Zero Token Cost)');
  console.log('====================================================');

  const enTTS = new MsEdgeTTS();
  await enTTS.setMetadata('en-IN-NeerjaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const knTTS = new MsEdgeTTS();
  await knTTS.setMetadata('kn-IN-GaganNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  for (const item of REEL_SCRIPTS) {
    // 1. English Voiceover
    const enFile = path.join(OUTPUT_DIR, `${item.id}_en.mp3`);
    console.log(`Generating English Voiceover: ${item.name}...`);
    const enStream = fs.createWriteStream(enFile);
    const { audioStream: enAudio } = enTTS.toStream(item.enScript);
    await new Promise((res, rej) => {
      enAudio.pipe(enStream);
      enStream.on('finish', res);
      enStream.on('error', rej);
    });
    console.log(`  -> Saved: ${enFile} (${fs.statSync(enFile).size} bytes)`);

    // 2. Kannada Voiceover
    const knFile = path.join(OUTPUT_DIR, `${item.id}_kn.mp3`);
    console.log(`Generating Kannada Voiceover: ${item.name}...`);
    const knStream = fs.createWriteStream(knFile);
    const { audioStream: knAudio } = knTTS.toStream(item.knScript);
    await new Promise((res, rej) => {
      knAudio.pipe(knStream);
      knStream.on('finish', res);
      knStream.on('error', rej);
    });
    console.log(`  -> Saved: ${knFile} (${fs.statSync(knFile).size} bytes)`);
  }

  console.log('\n✅ All regional voiceovers synthesized successfully in output/audio/');
}

generateVoiceovers().catch(console.error);
