#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
core/resolve_import.py (Deployed as Build_Reel_Studio.py inside DaVinci Resolve Utility Scripts)
Dynamically loads the active site under sites/<site_folder>/ into DaVinci Resolve:
  1) <timeline_name>_Editable  (V1 raw clips, V2 ProRes 4444 Alpha HUD, A1 synced audio + SFX)
  2) <timeline_name>_Final_MP4 (ready-to-export master clip)
"""

import json
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

_EMBED_ROOT = r"__REPO_ROOT__"
_SCRIPT_DIR_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = (
    _SCRIPT_DIR_ROOT
    if os.path.exists(os.path.join(_SCRIPT_DIR_ROOT, "sites"))
    else (_EMBED_ROOT if os.path.exists(os.path.join(_EMBED_ROOT, "sites")) else r"C:\sites\autonomous-real-estate-reels")
)


def sanitize_name(raw_name):
    cleaned = re.sub(r"[^A-Za-z0-9_-]+", "_", str(raw_name or "").strip()).strip("_")
    return cleaned or "Property_Reel"


def find_active_site_dir():
    ptr_file = os.path.join(REPO_ROOT, "sites", ".active_site.json")
    if os.path.exists(ptr_file):
        try:
            with open(ptr_file, "r", encoding="utf-8") as fh:
                d = json.load(fh).get("siteDir")
                if d and os.path.exists(os.path.join(d, "work", "hf", "generated_timeline.json")):
                    return d
        except Exception:
            pass

    sites_dir = os.path.join(REPO_ROOT, "sites")
    if os.path.exists(sites_dir):
        candidates = []
        for name in os.listdir(sites_dir):
            if name.startswith("_") or name.startswith("."):
                continue
            cand = os.path.join(sites_dir, name)
            tj = os.path.join(cand, "work", "hf", "generated_timeline.json")
            if os.path.exists(tj):
                candidates.append((os.path.getmtime(tj), cand))
        if candidates:
            candidates.sort(reverse=True)
            return candidates[0][1]
    return None


def get_unique_timeline_name(project, desired_name):
    existing = set()
    try:
        count = project.GetTimelineCount() or 0
        for idx in range(1, count + 1):
            tl = project.GetTimelineByIndex(idx)
            if tl:
                existing.add(tl.GetName())
    except Exception:
        pass
    if desired_name not in existing:
        return desired_name
    suffix = 2
    while f"{desired_name}_{suffix}" in existing:
        suffix += 1
    return f"{desired_name}_{suffix}"


def build_reel():
    print("==================================================")
    print("[Autonomous Real Estate Reels -> DaVinci Resolve]")
    print("==================================================")

    site_dir = find_active_site_dir()
    if not site_dir:
        print(f"ERROR: No prepared site found under {REPO_ROOT}\\sites\\. Run npm run prep first.")
        return False

    timeline_json = os.path.join(site_dir, "work", "hf", "generated_timeline.json")
    with open(timeline_json, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    tl_base = sanitize_name(data.get("timeline_name") or data.get("site_id"))
    editable_seq_name = f"{tl_base}_Editable"
    final_mp4_tl_name = f"{tl_base}_Final_MP4"

    out_dir = os.path.join(site_dir, "out")
    overlay_mov = os.path.join(out_dir, f"{tl_base}_hud_alpha.mov")
    master_mp4 = os.path.join(out_dir, f"{tl_base}.mp4")
    xml_path = os.path.join(out_dir, f"{tl_base}.xml")
    sfx_wav = os.path.join(out_dir, f"{tl_base}_sfx_master.wav")
    master_audio = sfx_wav if os.path.exists(sfx_wav) else data.get("masterAudioAbsPath")

    print(f"Active Site: {site_dir}")
    print(f"XML File:    {xml_path}")

    dvr = globals().get("resolve")
    if not dvr:
        try:
            import DaVinciResolveScript as bmd
            dvr = bmd.scriptapp("Resolve")
        except Exception as exc:
            print("Run inside DaVinci Resolve (Workspace > Scripts > Build_Reel_Studio):", exc)
            return False

    if not dvr:
        print("INFO: Open DaVinci Resolve -> Workspace > Scripts > Build_Reel_Studio")
        return False

    pm = dvr.GetProjectManager()
    project = pm.GetCurrentProject()
    proj_name = f"{tl_base}_Studio"
    if not project or project.GetName() == "Untitled Project":
        project = pm.LoadProject(proj_name) or pm.CreateProject(proj_name)

    project.SetSetting("timelineResolutionWidth", str(data.get("width", 1080)))
    project.SetSetting("timelineResolutionHeight", str(data.get("height", 1920)))
    project.SetSetting("timelineFrameRate", str(data.get("fps", 30)))
    project.SetSetting("useCustomTimelineSettings", "1")
    project.SetSetting("timelineInputRescaling", "Scale full frame with crop")

    media_pool = project.GetMediaPool()
    raw_videos = [s["absVideoPath"] for s in data["scenes"] if os.path.exists(s["absVideoPath"])]
    to_import = list(raw_videos)
    if os.path.exists(overlay_mov):
        to_import.append(overlay_mov)
    if master_audio and os.path.exists(master_audio):
        to_import.append(master_audio)

    media_pool.ImportMedia(to_import)

    if os.path.exists(master_mp4):
        mp4_items = media_pool.ImportMedia([master_mp4])
        if mp4_items:
            final_tl = media_pool.CreateTimelineFromClips(get_unique_timeline_name(project, final_mp4_tl_name), mp4_items)
            if final_tl:
                print(f"OK: Created Final MP4 Timeline -> {final_tl.GetName()}")

    edit_tl = None
    if os.path.exists(xml_path):
        edit_tl = media_pool.ImportTimelineFromFile(xml_path, {"timelineName": get_unique_timeline_name(project, editable_seq_name)})

    if not edit_tl and raw_videos:
        imported_videos = media_pool.ImportMedia(raw_videos)
        imported_overlay = media_pool.ImportMedia([overlay_mov]) if os.path.exists(overlay_mov) else []
        imported_audio = media_pool.ImportMedia([master_audio]) if (master_audio and os.path.exists(master_audio)) else []
        edit_tl = media_pool.CreateTimelineFromClips(get_unique_timeline_name(project, f"{tl_base}_Direct"), imported_videos)
        if edit_tl:
            project.SetCurrentTimeline(edit_tl)
            if imported_overlay:
                media_pool.AppendToTimeline([{"mediaPoolItem": imported_overlay[0], "mediaType": 1, "trackIndex": 2, "recordFrame": 0}])
            if imported_audio:
                media_pool.AppendToTimeline([{"mediaPoolItem": imported_audio[0], "mediaType": 2, "trackIndex": 1, "recordFrame": 0}])

    if edit_tl:
        project.SetCurrentTimeline(edit_tl)
        print(f"OK: Active Editable Timeline -> {edit_tl.GetName()}")

    dvr.OpenPage("edit")
    print("DONE! Check your timelines inside DaVinci Resolve.")
    return True


if __name__ == "__main__":
    build_reel()
