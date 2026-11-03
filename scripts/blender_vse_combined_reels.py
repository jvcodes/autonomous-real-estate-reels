"""
Unified 5-Reel Master Video Sequencer for Tumkur Real Estate (Blender 5.2 LTS)

Combines all 5 Featured Real Estate Properties into a single master timeline:
1. P.N.K Township (Sri Balaji Anugraha)
2. Green Meadows Smart Township (Batawadi Junction)
3. Royal Palms Luxury Enclave (Kuvempunagara)
4. Amani Lakeview County (Shanti Nagar)
5. Highway Gateway Smart City (Kyatsandra)

Architecture on Blender VSE Timeline:
- Channel 1: Google Maps Cartography Intros (City overview + camera dive + neon road trajectory)
- Channel 2: Physical Ground Walkthrough Tour Video Strips
- Channel 3: Cinematic Transitions (Gamma Crossfade between Intro & Walkthrough, and between Sites)
- Channel 4: Broadcast Lower-Third HUD Overlays (Price, Sq.Ft, Landmarks, Tags)
- Channel 5: Regional Neural Voiceover Audio Tracks (English / Kannada)
- Channel 6: Timeline Scene Markers for 1-click navigation between properties
- Channel 7: Secondary 3D CGI Flyover alternate track (Muted by default for easy A/B comparison)

Saves an editable master project:
-> C:\\sites\\map\\output\\blender\\00_Master_5_Reels_Combined_VSE.blend
Renders finished master video:
-> C:\\sites\\map\\output\\reels\\00_Master_5_Reels_Combined_EN.mp4 (and _KN.mp4)
"""

import sys
import os
import json
import math

try:
    import bpy
except ImportError:
    print("This script must be executed via Blender: blender -b -P blender_vse_combined_reels.py")
    sys.exit(0)

MASTER_CATALOG = "C:\\sites\\map\\data\\featured_reels_master.json"
MAPS_DIR = "C:\\sites\\map\\output\\maps"
OVERLAYS_DIR = "C:\\sites\\map\\output\\overlays"
AUDIO_DIR = "C:\\sites\\map\\output\\audio"
BLENDER_OUT_DIR = "C:\\sites\\map\\output\\blender"
REELS_OUT_DIR = "C:\\sites\\map\\output\\reels"

def load_catalog():
    if os.path.exists(MASTER_CATALOG):
        with open(MASTER_CATALOG, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def build_combined_vse_timeline(lang="en"):
    catalog = load_catalog()
    if not catalog:
        print("❌ Error: Master catalog is empty or missing.")
        return False

    os.makedirs(BLENDER_OUT_DIR, exist_ok=True)
    os.makedirs(REELS_OUT_DIR, exist_ok=True)

    print(f"\n========================================================")
    print(f"🎬 Initializing Master 5-Reel Combined VSE Pipeline ({lang.upper()})")
    print(f"========================================================")

    # 1. Initialize strictly with Blender's official Video_Editing application template
    bpy.ops.wm.read_homefile(app_template='Video_Editing')

    scene = bpy.context.scene
    scene.name = "Scene_Master_5_Reels"

    # Broadcast Resolution & Framerate
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100
    scene.render.fps = 30
    scene.frame_start = 1

    if not scene.sequence_editor:
        scene.sequence_editor_create()
    st = scene.sequence_editor.strips

    # Remove default strips if any exist
    for strip in list(st):
        st.remove(strip)

    current_frame = 1
    # Hollywood Film Director Pacing (High Context & Leisurely Drone Flights):
    # 8.0s (240 frames) Map Flight + 1.2s (36 frames) Melt Dissolve + 12.0s (360 frames) Walkthrough Tour
    intro_length_frames = 240      # 8.0s of Google Maps cartography (Wide Tumkur Overview + 4.8s Leisurely Dive + Route Hold)
    crossfade_frames = 36          # 1.2s luxurious Gamma Crossfade transition
    site_walkthrough_frames = 360  # 12.0s of rich ground walkthrough footage
    site_total_frames = 564        # 18.8s total per site section (5 sites = 94.0s / 1.56 mins master reel)

    previous_walkthrough_strip = None

    for idx, site in enumerate(catalog):
        site_id = site["id"]
        site_num = site["num"]
        site_name = site["name"]
        raw_video = site.get("rawVideo", "")
        map_video = os.path.join(MAPS_DIR, f"{site_id}_Map.mp4")
        overlay_png = os.path.join(OVERLAYS_DIR, f"{site_id}_Overlay.png")
        audio_file = os.path.join(AUDIO_DIR, f"{site_id}_{lang}.mp3")

        site_start_frame = current_frame
        print(f"\n🎬 Scene {site_num}: {site_name} (Frame {site_start_frame} to {site_start_frame + site_total_frames - 1})")

        # Add Timeline Scene Marker
        marker = scene.timeline_markers.new(name=f"Site {site_num}: {site_name[:18]}", frame=site_start_frame)

        # 1. Channel 1: Google Maps Cartography Intro Video Strip (Smooth Drone Dive)
        map_strip = None
        if os.path.exists(map_video):
            map_strip = st.new_movie(name=f"{site_num}_Map_{site_id}", filepath=map_video, channel=1, frame_start=site_start_frame)
            # Skip initial 0.5s tile cache, keep full 8.0s of smooth 60fps crane dive
            map_strip.animation_offset_start = 15
            map_strip.frame_final_duration = intro_length_frames
            print(f"  -> Channel 1: Google Maps Flight added ({intro_length_frames} frames / 8.0s)")
        else:
            print(f"  ⚠️ Warning: Map video not found at {map_video}, using placeholder color strip")
            map_strip = st.new_effect(name=f"{site_num}_Map_{site_id}", type='COLOR', channel=1,
                                      frame_start=site_start_frame, length=intro_length_frames)

        # 2. Channel 5: Neural Voiceover Audio Track
        if os.path.exists(audio_file):
            audio_strip = st.new_sound(name=f"{site_num}_Voice_{lang.upper()}", filepath=audio_file, channel=5, frame_start=site_start_frame)
            actual_audio_dur = audio_strip.frame_final_duration
            print(f"  -> Channel 5: Neural Voiceover loaded ({actual_audio_dur/30:.1f}s)")

        # 3. Channel 2: Ground Walkthrough Video Strip
        cut_frame = site_start_frame + intro_length_frames - crossfade_frames
        movie_strip = None
        if os.path.exists(raw_video):
            movie_strip = st.new_movie(name=f"{site_num}_Walkthrough_{site_id}", filepath=raw_video, channel=2, frame_start=cut_frame)
            movie_strip.animation_offset_start = 60 # Skip camera stabilization jitter
            movie_strip.frame_final_duration = site_walkthrough_frames
            print(f"  -> Channel 2: Ground Walkthrough Tour added at frame {cut_frame} ({site_walkthrough_frames} frames / 12.0s)")

            # 4. Channel 3: Hollywood 1.2s Dissolve Transition from Map Intro to Walkthrough
            if map_strip:
                trans = st.new_effect(name=f"{site_num}_MapToWalk_Cross", type='GAMMA_CROSS', channel=3,
                                      frame_start=cut_frame, input1=map_strip, input2=movie_strip)
                print(f"  -> Channel 3: 1.2s Cinematic Dissolve transition (Map -> Walkthrough)")

            # Inter-Site Dissolve transition from previous site's tour to this site's map flight
            if previous_walkthrough_strip and map_strip:
                site_trans = st.new_effect(name=f"Trans_Site{idx}_to_Site{idx+1}", type='GAMMA_CROSS', channel=3,
                                           frame_start=site_start_frame, input1=previous_walkthrough_strip, input2=map_strip)

            previous_walkthrough_strip = movie_strip

        # 5. Channel 4: Broadcast Lower-Third HUD Overlay Graphic
        if os.path.exists(overlay_png):
            overlay_strip = st.new_image(name=f"{site_num}_HUD_{site_id}", filepath=overlay_png, channel=4, frame_start=cut_frame)
            overlay_strip.frame_final_duration = site_walkthrough_frames
            overlay_strip.blend_type = 'ALPHA_OVER'
            print(f"  -> Channel 4: Broadcast Lower-Third Graphic overlay added with ALPHA_OVER")

        current_frame += site_total_frames

    # Set master timeline length
    scene.frame_end = current_frame - 1
    total_seconds = scene.frame_end / 30
    print(f"\n========================================================")
    print(f"🏁 Master Timeline Assembly Complete!")
    print(f"Total Duration: {scene.frame_end} frames ({total_seconds:.1f} seconds / {total_seconds/60:.2f} mins)")
    print(f"Total Properties Sequenced: {len(catalog)}")
    print(f"========================================================")

    # 4. Configure Direct Video Encoding Settings (MPEG-4 / H.264 / AAC)
    scene.render.image_settings.media_type = 'VIDEO'
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.audio_codec = 'AAC'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.ffmpeg.ffmpeg_preset = 'GOOD'

    out_mp4 = os.path.join(REELS_OUT_DIR, f"00_Master_5_Reels_Combined_{lang.upper()}.mp4")
    scene.render.filepath = out_mp4

    # 5. Ensure Scene and Video Editing Workspace are Active
    bpy.context.window.scene = scene
    if 'Video Editing' in bpy.data.workspaces:
        bpy.context.window.workspace = bpy.data.workspaces['Video Editing']

    # 6. Save Editable Master Project File
    blend_path = os.path.join(BLENDER_OUT_DIR, "00_Master_5_Reels_Combined_VSE.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"\n💾 Editable Master Blender Project Saved: {blend_path}")

    # 7. Render Master Video if requested
    if "--render" in sys.argv:
        print(f"\n🚀 Rendering Combined Master Video via Blender VSE (Frames 1 to {scene.frame_end})...")
        bpy.ops.render.render(animation=True, scene=scene.name)
        if os.path.exists(out_mp4):
            size_mb = os.path.getsize(out_mp4) / (1024 * 1024)
            print(f"\n🎉 SUCCESS! Master Combined Reel Rendered: {out_mp4} ({size_mb:.2f} MB)")
            return out_mp4
    else:
        print(f"💡 Project file saved. Pass --render to render master MP4.")

    return blend_path

if __name__ == "__main__":
    lang_arg = "en"
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        for i, a in enumerate(args):
            if a == "--lang" and i + 1 < len(args):
                lang_arg = args[i + 1]

    build_combined_vse_timeline(lang=lang_arg)
