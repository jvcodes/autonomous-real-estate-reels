"""
Autonomous Real Estate Reel Editor using Blender's Built-in Video Sequence Editor (VSE)

Architecture:
1. Scene 1 ('Scene_3D'): 
   - 3D FPV Drone flyover (1080x1920 @ 30 FPS, Eevee GPU engine)
   - Glowing neon road spline with animated trajectory
   - Holographic extruded plot boundary
   - 3D location pin with drop, physics bounce & ground shockwave
   - 3D floating typography (Name, Rate, Highway Distance)
   - Speed-ramp camera swoop (Frames 1 - 90 = 3.0s)

2. Scene 2 ('Scene_VSE'):
   - Master NLE Timeline inside Blender Sequence Editor
   - Channel 1: 3D Scene Strip (3D CGI intro)
   - Channel 2: Walkthrough Video Movie Strip
   - Channel 3: Seamless Gamma Crossfade Transition (3D -> Walkthrough)
   - Channel 4: Broadcast Lower-Third Overlay Image Strip (Alpha Over)
   - Channel 5: Neural Voiceover Audio Strip (Edge-TTS)

Outputs:
- Finished 1080x1920 MP4 rendered natively by Blender VSE (No external FFmpeg needed!)
- Saved editable .blend project file that the user can open visually in Blender GUI!
"""

import sys
import os
import json
import math

try:
    import bpy
    from mathutils import Vector, Euler
except ImportError:
    print("This script is meant to be run inside Blender: blender -b -P blender_vse_reel_editor.py")
    sys.exit(0)

MASTER_CATALOG = "C:\\sites\\map\\data\\featured_reels_master.json"

def load_site_data(site_id="01_PNK_Township"):
    if os.path.exists(MASTER_CATALOG):
        with open(MASTER_CATALOG, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
            matched = next((s for s in catalog if site_id.lower() in s["id"].lower() or site_id == s["num"]), None)
            if matched:
                return matched
            return catalog[0]
    return None

def build_3d_stage(site_data):
    """Sets up the 3D CGI animation in Scene_3D."""
    # Start fresh
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene_3d = bpy.context.scene
    scene_3d.name = "Scene_3D"

    # Resolution & Frame Rate
    scene_3d.render.resolution_x = 1080
    scene_3d.render.resolution_y = 1920
    scene_3d.render.resolution_percentage = 100
    scene_3d.render.fps = 30
    scene_3d.frame_start = 1
    scene_3d.frame_end = 90  # 3.0s

    scene_3d.render.engine = 'BLENDER_EEVEE'

    # Dark Cyber Environment
    world = bpy.data.worlds.new("World_3D")
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs['Color'].default_value = (0.015, 0.02, 0.035, 1.0)
        bg_node.inputs['Strength'].default_value = 0.7
    scene_3d.world = world

    # Sun Lighting
    sun_data = bpy.data.lights.new(name="SunKey", type='SUN')
    sun_data.energy = 3.5
    sun_data.color = (0.9, 0.95, 1.0)
    sun_obj = bpy.data.objects.new(name="SunKey", object_data=sun_data)
    scene_3d.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = Euler((math.radians(52), math.radians(20), math.radians(-30)), 'XYZ')

    # Color Rim Accent Light matching site's theme
    site_rgb = site_data.get("colorRgba", [1.0, 0.65, 0.08, 1.0])
    rim_data = bpy.data.lights.new(name="RimLight", type='POINT')
    rim_data.energy = 2500
    rim_data.color = (site_rgb[0], site_rgb[1], site_rgb[2])
    rim_obj = bpy.data.objects.new(name="RimLight", object_data=rim_data)
    scene_3d.collection.objects.link(rim_obj)
    rim_obj.location = (0, 6, 5)

    # Cyber Ground Plane
    bpy.ops.mesh.primitive_plane_add(size=90, location=(0, 0, -0.05))
    ground = bpy.context.active_object
    ground.name = "GroundTerrain"
    mat_ground = bpy.data.materials.new("GroundMat")
    mat_ground.use_nodes = True
    bsdf_ground = mat_ground.node_tree.nodes.get("Principled BSDF")
    if bsdf_ground:
        bsdf_ground.inputs['Base Color'].default_value = (0.025, 0.032, 0.048, 1.0)
        bsdf_ground.inputs['Roughness'].default_value = 0.6
        bsdf_ground.inputs['Metallic'].default_value = 0.35
    ground.data.materials.append(mat_ground)

    # Concentric Shockwave Ripple Ring (Expands on Pin Impact)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.02, location=(0, -0.5, 0.01))
    shockwave = bpy.context.active_object
    shockwave.name = "ImpactShockwave"
    mat_sw = bpy.data.materials.new("ShockwaveMat")
    mat_sw.use_nodes = True
    sw_nodes = mat_sw.node_tree.nodes
    sw_nodes.clear()
    sw_emit = sw_nodes.new(type='ShaderNodeEmission')
    sw_emit.inputs['Color'].default_value = (site_rgb[0], site_rgb[1], site_rgb[2], 1.0)
    sw_emit.inputs['Strength'].default_value = 12.0
    sw_out = sw_nodes.new(type='ShaderNodeOutputMaterial')
    mat_sw.node_tree.links.new(sw_emit.outputs['Emission'], sw_out.inputs['Surface'])
    shockwave.data.materials.append(mat_sw)

    # Shockwave Animation
    shockwave.scale = Vector((0.01, 0.01, 0.01))
    shockwave.keyframe_insert(data_path="scale", frame=48)
    shockwave.scale = Vector((6.5, 6.5, 0.05))
    shockwave.keyframe_insert(data_path="scale", frame=72)

    # 3D Holographic Plot Boundary Extrusion
    boundary_pts = site_data.get("boundary", [
        [-2.4, -1.6, 0.0], [2.2, -1.8, 0.0], [2.5, 1.7, 0.0], [-0.4, 2.3, 0.0], [-2.5, 0.9, 0.0]
    ])
    curve_data = bpy.data.curves.new("BoundaryCurve", type='CURVE')
    curve_data.dimensions = '3D'
    polyline = curve_data.splines.new('POLY')
    polyline.points.add(len(boundary_pts))
    for i, pt in enumerate(boundary_pts):
        polyline.points[i].co = (pt[0], pt[1], pt[2], 1.0)
    polyline.points[len(boundary_pts)].co = (boundary_pts[0][0], boundary_pts[0][1], boundary_pts[0][2], 1.0)

    curve_data.bevel_depth = 0.07
    curve_data.extrude = 0.45
    boundary_obj = bpy.data.objects.new("PlotBoundary", curve_data)
    scene_3d.collection.objects.link(boundary_obj)

    mat_boundary = bpy.data.materials.new("HoloBoundaryMat")
    mat_boundary.use_nodes = True
    b_nodes = mat_boundary.node_tree.nodes
    b_nodes.clear()
    b_emit = b_nodes.new(type='ShaderNodeEmission')
    b_emit.inputs['Color'].default_value = (site_rgb[0], site_rgb[1], site_rgb[2], 1.0)
    b_emit.inputs['Strength'].default_value = 9.0
    b_out = b_nodes.new(type='ShaderNodeOutputMaterial')
    mat_boundary.node_tree.links.new(b_emit.outputs['Emission'], b_out.inputs['Surface'])
    boundary_obj.data.materials.append(mat_boundary)

    # 3D Glowing Neon Road Spline
    road_pts = site_data.get("roadPoints", [
        [0.0, -14.0, 0.1], [-1.5, -9.0, 0.2], [-0.8, -4.5, 0.3], [0.0, -1.8, 0.35]
    ])
    road_curve_data = bpy.data.curves.new("RoadSpline", type='CURVE')
    road_curve_data.dimensions = '3D'
    road_spline = road_curve_data.splines.new('BEZIER')
    road_spline.bezier_points.add(len(road_pts) - 1)
    for i, pt in enumerate(road_pts):
        bp = road_spline.bezier_points[i]
        bp.co = Vector((pt[0], pt[1], pt[2]))
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'

    road_curve_data.bevel_depth = 0.15
    road_curve_data.bevel_resolution = 6
    road_obj = bpy.data.objects.new("GlowingRoad", road_curve_data)
    scene_3d.collection.objects.link(road_obj)

    mat_road = bpy.data.materials.new("NeonRoadMat")
    mat_road.use_nodes = True
    r_nodes = mat_road.node_tree.nodes
    r_nodes.clear()
    r_emit = r_nodes.new(type='ShaderNodeEmission')
    r_emit.inputs['Color'].default_value = (0.2, 1.0, 0.65, 1.0)
    r_emit.inputs['Strength'].default_value = 16.0
    r_out = r_nodes.new(type='ShaderNodeOutputMaterial')
    mat_road.node_tree.links.new(r_emit.outputs['Emission'], r_out.inputs['Surface'])
    road_obj.data.materials.append(mat_road)

    # Animate Road Bevel
    road_curve_data.bevel_factor_end = 0.0
    road_curve_data.keyframe_insert(data_path="bevel_factor_end", frame=8)
    road_curve_data.bevel_factor_end = 1.0
    road_curve_data.keyframe_insert(data_path="bevel_factor_end", frame=48)

    # 3D Location Pin
    bpy.ops.mesh.primitive_cone_add(radius1=0.45, radius2=0.0, depth=0.9, location=(0, -0.5, 1.8))
    pin = bpy.context.active_object
    pin.name = "LocationPin"
    pin.rotation_euler = Euler((math.radians(180), 0, 0), 'XYZ')

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.45, location=(0, -0.5, 1.8 + 0.45))
    pin_cap = bpy.context.active_object
    pin_cap.parent = pin

    mat_pin = bpy.data.materials.new("PinMat")
    mat_pin.use_nodes = True
    p_nodes = mat_pin.node_tree.nodes
    p_nodes.clear()
    p_emit = p_nodes.new(type='ShaderNodeEmission')
    p_emit.inputs['Color'].default_value = (site_rgb[0], site_rgb[1], site_rgb[2], 1.0)
    p_emit.inputs['Strength'].default_value = 12.0
    p_out = p_nodes.new(type='ShaderNodeOutputMaterial')
    mat_pin.node_tree.links.new(p_emit.outputs['Emission'], p_out.inputs['Surface'])
    pin.data.materials.append(mat_pin)
    pin_cap.data.materials.append(mat_pin)

    # Pin Fall & Bounce Animation
    pin.location.z = 9.0
    pin.scale = Vector((0.01, 0.01, 0.01))
    pin.keyframe_insert(data_path="location", frame=30)
    pin.keyframe_insert(data_path="scale", frame=30)

    pin.location.z = 0.85
    pin.scale = Vector((1.0, 1.0, 1.0))
    pin.keyframe_insert(data_path="location", frame=48)
    pin.keyframe_insert(data_path="scale", frame=48)

    pin.location.z = 1.4
    pin.keyframe_insert(data_path="location", frame=56)

    pin.location.z = 0.85
    pin.keyframe_insert(data_path="location", frame=64)

    # 3D Floating Typography
    bpy.ops.object.text_add(location=(-2.0, 0.2, 2.3))
    text_obj = bpy.context.active_object
    text_obj.name = "FloatingText"
    title_text = site_data.get("name", "PREMIUM TOWNSHIP")
    rate_text = site_data.get("rate", "₹1,950 / SQ.FT")
    dist_text = site_data.get("dist", "500m to Highway")
    text_obj.data.body = f"{title_text}\n{rate_text}\n{dist_text}"
    text_obj.data.size = 0.36
    text_obj.data.extrude = 0.04
    text_obj.data.align_x = 'CENTER'
    text_obj.rotation_euler = Euler((math.radians(72), 0, 0), 'XYZ')

    mat_text = bpy.data.materials.new("TextMat")
    mat_text.use_nodes = True
    t_nodes = mat_text.node_tree.nodes
    t_nodes.clear()
    t_emit = t_nodes.new(type='ShaderNodeEmission')
    t_emit.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1.0)
    t_emit.inputs['Strength'].default_value = 8.0
    t_out = t_nodes.new(type='ShaderNodeOutputMaterial')
    mat_text.node_tree.links.new(t_emit.outputs['Emission'], t_out.inputs['Surface'])
    text_obj.data.materials.append(mat_text)

    # Text Pop-in
    text_obj.scale = Vector((0.001, 0.001, 0.001))
    text_obj.keyframe_insert(data_path="scale", frame=44)
    text_obj.scale = Vector((1.0, 1.0, 1.0))
    text_obj.keyframe_insert(data_path="scale", frame=58)

    # Cinematic FPV Drone Camera
    cam_data = bpy.data.cameras.new("DroneCamera")
    cam_data.lens = 22
    cam_data.dof.use_dof = True
    cam_data.dof.focus_object = pin
    cam_data.dof.aperture_fstop = 2.8

    cam_obj = bpy.data.objects.new("DroneCamera", cam_data)
    scene_3d.collection.objects.link(cam_obj)
    scene_3d.camera = cam_obj

    # Flight Keyframes
    cam_obj.location = Vector((0.0, -23.0, 19.0))
    cam_obj.rotation_euler = Euler((math.radians(44), 0, 0), 'XYZ')
    cam_obj.keyframe_insert(data_path="location", frame=1)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=1)

    cam_obj.location = Vector((1.6, -13.5, 9.5))
    cam_obj.rotation_euler = Euler((math.radians(56), math.radians(5), math.radians(-7)), 'XYZ')
    cam_obj.keyframe_insert(data_path="location", frame=45)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=45)

    cam_obj.location = Vector((0.0, -6.6, 3.8))
    cam_obj.rotation_euler = Euler((math.radians(68), 0, 0), 'XYZ')
    cam_obj.keyframe_insert(data_path="location", frame=78)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=78)

    cam_obj.location = Vector((0.0, -2.2, 1.8))
    cam_obj.rotation_euler = Euler((math.radians(78), 0, 0), 'XYZ')
    cam_obj.keyframe_insert(data_path="location", frame=90)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=90)

    print(f"✅ Scene_3D constructed successfully.")
    return scene_3d

def build_vse_timeline(site_data, scene_3d, lang="en"):
    """Creates the Master Video Sequence Editor scene and populates all channels."""
    site_id = site_data.get("id")
    raw_video = site_data.get("rawVideo")
    overlay_png = f"C:\\sites\\map\\output\\overlays\\{site_id}_Overlay.png"
    audio_file = f"C:\\sites\\map\\output\\audio\\{site_id}_{lang}.mp3"

    print(f"\n🎬 Assembling Blender VSE Timeline for: {site_data.get('name')} ({lang.upper()})")
    print(f"Walkthrough Video: {raw_video}")
    print(f"Overlay Graphic:   {overlay_png}")
    print(f"Narration Audio:   {audio_file}")

    # Create dedicated VSE Scene
    scene_vse = bpy.data.scenes.new("Scene_VSE")
    scene_vse.sequence_editor_create()
    st = scene_vse.sequence_editor.strips

    # Match Resolution & Framerate
    scene_vse.render.resolution_x = 1080
    scene_vse.render.resolution_y = 1920
    scene_vse.render.resolution_percentage = 100
    scene_vse.render.fps = 30
    scene_vse.frame_start = 1

    # 1. Channel 1: 3D CGI Flyover Scene Strip (Frames 1 to 90)
    intro_strip = st.new_scene(name="3D_CGI_Intro", scene=scene_3d, channel=1, frame_start=1)

    # 2. Channel 5: Neural Voiceover Audio Strip (Determines overall duration)
    audio_strip = None
    total_reel_frames = 420  # Default ~14.0s @ 30 FPS
    if os.path.exists(audio_file):
        audio_strip = st.new_sound(name="Voiceover_Audio", filepath=audio_file, channel=5, frame_start=1)
        total_reel_frames = min(audio_strip.frame_final_duration, 450)
        print(f"  -> Voiceover loaded. Duration: {total_reel_frames} frames ({total_reel_frames/30:.1f}s)")

    # 3. Channel 2: Physical Walkthrough Tour Movie Strip
    # Starts at frame 82 with 8 frames overlap for the whip/speed transition
    cut_frame = 82
    walkthrough_duration = total_reel_frames - cut_frame + 5
    if os.path.exists(raw_video):
        movie_strip = st.new_movie(name="Walkthrough_Tour", filepath=raw_video, channel=2, frame_start=cut_frame)
        # Skip initial 2 seconds of camera stabilization
        movie_strip.animation_offset_start = 45
        movie_strip.frame_final_duration = walkthrough_duration
        print(f"  -> Walkthrough added at frame {cut_frame}. Duration: {walkthrough_duration} frames")

        # 4. Channel 3: Smooth Crossfade Transition (3D Scene -> Walkthrough)
        trans = st.new_effect(name="SpeedRamp_Crossfade", type='GAMMA_CROSS', channel=3, 
                              frame_start=cut_frame, input1=intro_strip, input2=movie_strip)
        print(f"  -> SpeedRamp Crossfade transition created.")

    # 5. Channel 4: Broadcast Lower-Third Overlay Graphic Strip
    if os.path.exists(overlay_png):
        overlay_strip = st.new_image(name="HUD_Overlay", filepath=overlay_png, channel=4, frame_start=cut_frame)
        overlay_strip.frame_final_duration = walkthrough_duration
        overlay_strip.blend_type = 'ALPHA_OVER'
        print(f"  -> Broadcast HUD Overlay added with ALPHA_OVER.")

    # Set master timeline end frame
    scene_vse.frame_end = total_reel_frames

    # Output Video Configuration: MPEG-4 / H.264 / AAC High Quality
    scene_vse.render.image_settings.media_type = 'VIDEO'
    scene_vse.render.image_settings.file_format = 'FFMPEG'
    scene_vse.render.ffmpeg.format = 'MPEG4'
    scene_vse.render.ffmpeg.codec = 'H264'
    scene_vse.render.ffmpeg.audio_codec = 'AAC'
    scene_vse.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene_vse.render.ffmpeg.ffmpeg_preset = 'GOOD'

    out_mp4 = f"C:\\sites\\map\\output\\reels\\{site_id}_VSE_REEL_{lang.upper()}.mp4"
    scene_vse.render.filepath = out_mp4

    # Save permanent .blend project file for inspection in Blender GUI
    blend_path = f"C:\\sites\\map\\output\\blender\\{site_id}_VSE_Project.blend"
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"💾 Editable Blender Project Saved: {blend_path}")

    return scene_vse, out_mp4

def render_vse_reel(site_id="01_PNK_Township", lang="en"):
    site_data = load_site_data(site_id)
    if not site_data:
        print(f"❌ Failed to load metadata for site: {site_id}")
        return False

    # 1. Build 3D Stage
    scene_3d = build_3d_stage(site_data)

    # 2. Build VSE Timeline
    scene_vse, out_mp4 = build_vse_timeline(site_data, scene_3d, lang=lang)

    # 3. Set Active Window Scene to Scene_VSE
    bpy.context.window.scene = scene_vse

    # 4. Render Master Reel
    print(f"\n🚀 Rendering complete reel directly via Blender VSE (Frames 1 to {scene_vse.frame_end})...")
    bpy.ops.render.render(animation=True, scene='Scene_VSE')

    if os.path.exists(out_mp4):
        size_mb = os.path.getsize(out_mp4) / (1024 * 1024)
        print(f"\n🎉 SUCCESS! Master Reel Rendered from Blender VSE: {out_mp4} ({size_mb:.2f} MB)")
        return out_mp4
    else:
        print(f"❌ Render did not produce expected file: {out_mp4}")
        return False

if __name__ == "__main__":
    site_arg = "01_PNK_Township"
    lang_arg = "en"

    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        for i, a in enumerate(args):
            if a == "--site" and i + 1 < len(args):
                site_arg = args[i + 1]
            elif a == "--lang" and i + 1 < len(args):
                lang_arg = args[i + 1]

    render_vse_reel(site_arg, lang_arg)
