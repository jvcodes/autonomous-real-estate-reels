"""
Autonomous 3D Cinematic Reel Generator for Real Estate (Blender Python bpy)
Renders a 1080x1920 9:16 Vertical 3D FPV Drone Flyover with:
- Cyber-Cartography Holographic Grid & Concentric Radar Ring
- 3D Holographic Plot Boundary Extrusion with Volumetric Glow
- 3D Glowing Neon Road Spline (Light-beam trajectory from Highway to Site Gate)
- 3D Bouncing Location Pin Drop with Impact Shockwave
- 3D Floating Holographic Typography (Project Title, Rate & Distance)
- Cinematic Speed-Ramp Drone Camera with Depth-of-Field & Terminal Dive Transition
"""

import sys
import os
import json
import math
import subprocess

try:
    import bpy
    from mathutils import Vector, Euler
except ImportError:
    print("This script is meant to be run inside Blender: blender -b -P blender_3d_flyover.py")
    sys.exit(0)

FFMPEG_BIN = "C:\\sites\\map\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe"
DATA_CATALOG = "C:\\sites\\map\\data\\featured_reels_master.json"

def load_catalog():
    if os.path.exists(DATA_CATALOG):
        with open(DATA_CATALOG, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def setup_3d_scene(site_data, frames_dir):
    # 1. Reset Scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    # 2. Render Settings (1080x1920 9:16 Vertical Reel @ 30 FPS, 3.0s = 90 frames)
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100
    scene.render.fps = 30
    scene.frame_start = 1
    scene.frame_end = 90

    scene.render.engine = 'BLENDER_EEVEE'

    # Output PNG sequence
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.image_settings.compression = 15
    scene.render.filepath = os.path.join(frames_dir, "frame_")

    # 3. World / Ambient Dark Cyber-Atmosphere
    world = bpy.data.worlds.new("ReelWorld")
    world.use_nodes = True
    bg_node = world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs['Color'].default_value = (0.015, 0.02, 0.035, 1.0)
        bg_node.inputs['Strength'].default_value = 0.7
    scene.world = world

    # Sun Key Light
    sun_data = bpy.data.lights.new(name="SunKey", type='SUN')
    sun_data.energy = 3.5
    sun_data.color = (0.9, 0.95, 1.0)
    sun_obj = bpy.data.objects.new(name="SunKey", object_data=sun_data)
    scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = Euler((math.radians(52), math.radians(20), math.radians(-30)), 'XYZ')

    # Color Rim Accent Light matching site's theme
    site_rgb = site_data.get("colorRgba", [1.0, 0.65, 0.08, 1.0])
    rim_data = bpy.data.lights.new(name="RimLight", type='POINT')
    rim_data.energy = 2500
    rim_data.color = (site_rgb[0], site_rgb[1], site_rgb[2])
    rim_obj = bpy.data.objects.new(name="RimLight", object_data=rim_data)
    scene.collection.objects.link(rim_obj)
    rim_obj.location = (0, 6, 5)

    # 4. Cyber Ground Plane (Deep Obsidian with Specular Sheen)
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

    # 5. Concentric Shockwave Ripple Ring (Expands on Pin Impact)
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

    # Shockwave Animation: Inactive until frame 48, expands to radius 7.0 by frame 75
    shockwave.scale = Vector((0.01, 0.01, 0.01))
    shockwave.keyframe_insert(data_path="scale", frame=48)
    shockwave.scale = Vector((6.5, 6.5, 0.05))
    shockwave.keyframe_insert(data_path="scale", frame=72)

    # 6. 3D Holographic Plot Boundary Extrusion
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
    scene.collection.objects.link(boundary_obj)

    # Holographic Emission Material
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

    # 7. 3D Glowing Neon Road Spline (Highway to Site Access Route)
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
    scene.collection.objects.link(road_obj)

    mat_road = bpy.data.materials.new("NeonRoadMat")
    mat_road.use_nodes = True
    r_nodes = mat_road.node_tree.nodes
    r_nodes.clear()
    r_emit = r_nodes.new(type='ShaderNodeEmission')
    r_emit.inputs['Color'].default_value = (0.2, 1.0, 0.65, 1.0)  # High-intensity Neon Green
    r_emit.inputs['Strength'].default_value = 16.0
    r_out = r_nodes.new(type='ShaderNodeOutputMaterial')
    mat_road.node_tree.links.new(r_emit.outputs['Emission'], r_out.inputs['Surface'])
    road_obj.data.materials.append(mat_road)

    # Animate Road Drawing
    road_curve_data.bevel_factor_end = 0.0
    road_curve_data.keyframe_insert(data_path="bevel_factor_end", frame=8)
    road_curve_data.bevel_factor_end = 1.0
    road_curve_data.keyframe_insert(data_path="bevel_factor_end", frame=48)

    # 8. 3D Premium Location Pin Drop with Realistic Squash & Bounce
    bpy.ops.mesh.primitive_cone_add(radius1=0.45, radius2=0.0, depth=0.9, location=(0, -0.5, 1.8))
    pin = bpy.context.active_object
    pin.name = "LocationPin"
    pin.rotation_euler = Euler((math.radians(180), 0, 0), 'XYZ')

    # Sphere cap on pin top
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

    # Pin Drop Keyframing (Fall from sky, impact at 48, bounce at 55, settle at 62)
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

    # 9. 3D Floating Typography (Project Title, Rate, Distance)
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

    # Animate Text Pop-in
    text_obj.scale = Vector((0.001, 0.001, 0.001))
    text_obj.keyframe_insert(data_path="scale", frame=44)
    text_obj.scale = Vector((1.0, 1.0, 1.0))
    text_obj.keyframe_insert(data_path="scale", frame=58)

    # 10. Cinematic 3D FPV Drone Camera (Speed-Ramp Trajectory)
    cam_data = bpy.data.cameras.new("DroneCamera")
    cam_data.lens = 22  # Ultra-wide 9:16 vertical perspective
    cam_data.dof.use_dof = True
    cam_data.dof.focus_object = pin
    cam_data.dof.aperture_fstop = 2.8

    cam_obj = bpy.data.objects.new("DroneCamera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Flight Keyframes
    # 1. High Orbit Overview (frame 1)
    cam_obj.location = Vector((0.0, -23.0, 19.0))
    cam_obj.rotation_euler = Euler((math.radians(44), 0, 0), 'XYZ')
    cam_obj.keyframe_insert(data_path="location", frame=1)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=1)

    # 2. Banking curve tracking the road curve (frame 45)
    cam_obj.location = Vector((1.6, -13.5, 9.5))
    cam_obj.rotation_euler = Euler((math.radians(56), math.radians(5), math.radians(-7)), 'XYZ')
    cam_obj.keyframe_insert(data_path="location", frame=45)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=45)

    # 3. Hero Entrance Gate framing (frame 78)
    cam_obj.location = Vector((0.0, -6.6, 3.8))
    cam_obj.rotation_euler = Euler((math.radians(68), 0, 0), 'XYZ')
    cam_obj.keyframe_insert(data_path="location", frame=78)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=78)

    # 4. Terminal Speed-Ramp Dive! (frame 90) - Surges into pin/gate for seamless cut!
    cam_obj.location = Vector((0.0, -2.2, 1.8))
    cam_obj.rotation_euler = Euler((math.radians(78), 0, 0), 'XYZ')
    cam_obj.keyframe_insert(data_path="location", frame=90)
    cam_obj.keyframe_insert(data_path="rotation_euler", frame=90)

    print(f"🎬 3D Scene setup complete for: {site_data.get('name')}")

def render_site_flyover(site_data):
    site_id = site_data.get("id")
    base_dir = "C:\\sites\\map\\output\\blender"
    frames_dir = os.path.join(base_dir, f"frames_{site_id}")
    os.makedirs(frames_dir, exist_ok=True)
    out_mp4 = os.path.join(base_dir, f"{site_id}_3DFlyover.mp4")

    print(f"\n========================================================")
    print(f"🚀 Rendering 3D Drone Flyover: {site_data.get('name')} ({site_id})")
    print(f"Frames Directory: {frames_dir}")
    print(f"Output MP4: {out_mp4}")

    setup_3d_scene(site_data, frames_dir)

    print("Rendering 90 frames with Blender Eevee...")
    bpy.ops.render.render(animation=True)
    print("✅ Frames rendered.")

    # Encode with FFmpeg
    print("🎬 Compiling into 1080x1920 MP4 with FFmpeg...")
    frame_pattern = os.path.join(frames_dir, "frame_%04d.png")
    cmd = [
        FFMPEG_BIN,
        "-y",
        "-framerate", "30",
        "-i", frame_pattern,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        out_mp4
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        file_mb = (os.path.getsize(out_mp4) / (1024 * 1024))
        print(f"🎉 SUCCESS: 3D Flyover Ready: {out_mp4} ({file_mb:.2f} MB)")
        return out_mp4
    else:
        print("❌ FFmpeg compile error:", res.stderr)
        return None

if __name__ == "__main__":
    catalog = load_catalog()
    if not catalog:
        print("❌ Catalog is empty. Please verify featured_reels_master.json")
        sys.exit(1)

    # Parse arguments passed after '--'
    target_site = "01_PNK_Township"
    render_all = False

    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        for i, arg in enumerate(args):
            if arg == "--site" and i + 1 < len(args):
                target_site = args[i + 1]
            elif arg == "--all":
                render_all = True

    if render_all:
        print(f"🌟 Batch rendering 3D flyovers for ALL {len(catalog)} sites...")
        for site in catalog:
            render_site_flyover(site)
    else:
        # Match target_site by id or prefix
        matched = next((s for s in catalog if target_site.lower() in s["id"].lower() or target_site == s["num"]), None)
        if matched:
            render_site_flyover(matched)
        else:
            print(f"⚠️ Site '{target_site}' not found in catalog, defaulting to Site 1.")
            render_site_flyover(catalog[0])
