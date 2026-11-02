// Automated 9:16 Broadcast Motion Graphics & Reel Pipeline for Tumkur Real Estate
// 100% Non-Interactive Self-Running Stage (Map Flights + Road Curves + Video Walkthroughs)

let map;
let sitePolygons = [];
let siteMarkers = [];
let currentSiteIndex = 0;
let isPipelineRunning = true;
let siteStageTimer = null;
let storyAnimInterval = null;
let stageStartTime = 0;
let isVideoMuted = true;
let currentMapMode = "cinema-dark";

// Broadcast Timings (Total ~17.7s per layout reel)
const MAP_ORIENTATION_PAUSE_MS = 5000; // 5.0s on city map overview
const CAMERA_DIVE_MS = 700;            // 0.7s smooth glide
const ROAD_DISTANCE_HOLD_MS = 3500;    // 3.5s hold on road distance arrow
const REEL_VIDEO_PLAY_MS = 8500;       // 8.5s full-bleed walkthrough video
const TOTAL_SITE_DURATION_MS = MAP_ORIENTATION_PAUSE_MS + CAMERA_DIVE_MS + ROAD_DISTANCE_HOLD_MS + REEL_VIDEO_PLAY_MS;

// Blinking Road & Arrow Objects
let activeRoadGlowPolyline = null;
let activeRoadCorePolyline = null;
let activeDistanceOverlay = null;
let roadPulseAnimFrame = null;
let roadPulseAngle = 0;
let arrowAnimTimer = null;

// 1. Cinema Dark Google Maps Base Style (Zero Default POI, Icons, Clutter)
const CINEMA_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#080c14" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#06090e" }, { weight: 2.5 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#f8fafc" }, { weight: 2 }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#141b26" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] }
];

const MINIMAL_LIGHT_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bae6fd" }] }
];

// 2. Google Maps Loader
function loadGoogleMaps() {
  if (!CONFIG.GOOGLE_MAPS_API_KEY || CONFIG.GOOGLE_MAPS_API_KEY === "PASTE_YOUR_API_KEY_HERE") {
    console.error("Please configure your Google Maps API Key in config.js");
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&callback=initTumkurMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

// 3. Map Initialization (Clean Broadcast Canvas, Zero UI Buttons)
window.initTumkurMap = function() {
  const tumkurCenter = CONFIG.DEFAULT_CENTER || { lat: 13.3409, lng: 77.1010 };

  const mapOptions = {
    center: tumkurCenter,
    zoom: 12.8,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true, // Suppress all Google zoom/pegman/map-type buttons
    gestureHandling: "none", // Page is a non-interactive video reel canvas
    keyboardShortcuts: false,
    styles: CINEMA_DARK_STYLE
  };

  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  renderSites();
  setupKeyboardShortcuts();

  // Autonomous Self-Running Reel Pipeline Starts Automatically
  setTimeout(() => {
    startAutonomousReelPipeline();
  }, 1000);
};

// 4. Render 5 Featured Sites with Organic Multi-Vertex Polygons & High-DPI Badges
function renderSites() {
  sitePolygons.forEach(p => p.setMap(null));
  siteMarkers.forEach(m => m.setMap(null));
  sitePolygons = [];
  siteMarkers = [];

  ALL_TUMKUR_SITES.forEach((area, index) => {
    const isFeatured = index < FEATURED_REEL_SITES.length;

    // Boundary Polygon
    const poly = new google.maps.Polygon({
      paths: area.polygon,
      strokeColor: area.color,
      strokeOpacity: isFeatured ? 0.90 : 0.40,
      strokeWeight: isFeatured ? 2.0 : 1.2,
      fillColor: area.color,
      fillOpacity: isFeatured ? 0.20 : 0.10,
      map: map,
      zIndex: isFeatured ? 10 : 1,
      clickable: false
    });

    sitePolygons.push(poly);

    // Custom Map Marker Overlay
    class SiteMarkerOverlay extends google.maps.OverlayView {
      constructor(site, idx, featured) {
        super();
        this.site = site;
        this.index = idx;
        this.isFeatured = featured;
        this.div = null;
      }

      onAdd() {
        const div = document.createElement("div");
        div.className = "site-marker-overlay";
        div.id = `site-marker-${this.index}`;
        div.style.setProperty("--site-color", this.site.color);

        if (this.isFeatured) {
          div.innerHTML = `
            <div class="site-marker-card">
              <div class="site-number-badge">${this.index + 1}</div>
              <div class="site-info-stack">
                <span class="site-name-text">${this.site.name}</span>
                <span class="site-rate-text">${this.site.pricePerSqFt}</span>
              </div>
            </div>
          `;
        } else {
          div.innerHTML = `
            <div class="site-marker-card" style="opacity: 0.65; transform: scale(0.85);">
              <span class="site-name-text" style="font-size:9px;">${this.site.name}</span>
            </div>
          `;
        }

        this.div = div;
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(div);
      }

      draw() {
        const overlayProjection = this.getProjection();
        if (!overlayProjection || !this.div) return;

        const pos = overlayProjection.fromLatLngToDivPixel(
          new google.maps.LatLng(this.site.center.lat, this.site.center.lng)
        );

        if (pos) {
          this.div.style.left = pos.x + "px";
          this.div.style.top = pos.y + "px";
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const markerOverlay = new SiteMarkerOverlay(area, index, isFeatured);
    markerOverlay.setMap(map);
    siteMarkers.push(markerOverlay);
  });
}

// 5. Animated Road-to-Site Curved Arrow Trajectory & Distance Callout
function animateRoadToSiteArrow(site, onReadyForReel) {
  clearBlinkingRoad();
  if (!site.accessRoad || !site.accessRoad.path) {
    if (onReadyForReel) onReadyForReel();
    return;
  }

  const road = site.accessRoad;
  const fullPath = road.path;

  // Arrowhead Icon
  const arrowSymbol = {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 3.5,
    strokeColor: site.color,
    strokeWeight: 1.5,
    fillColor: "#ffffff",
    fillOpacity: 1.0
  };

  // 1. Glowing Halo Polyline
  activeRoadGlowPolyline = new google.maps.Polyline({
    path: [fullPath[0]],
    strokeColor: site.color,
    strokeOpacity: 0.8,
    strokeWeight: 10,
    map: map,
    zIndex: 40,
    clickable: false
  });

  // 2. Core Progressively Traced Polyline
  activeRoadCorePolyline = new google.maps.Polyline({
    path: [fullPath[0]],
    strokeColor: "#ffffff",
    strokeOpacity: 0.95,
    strokeWeight: 4,
    icons: [{
      icon: arrowSymbol,
      offset: "100%"
    }],
    map: map,
    zIndex: 42,
    clickable: false
  });

  // 3. Distance Callout Overlay Badge
  const midPoint = fullPath[Math.floor(fullPath.length / 2)] || site.center;
  activeDistanceOverlay = new google.maps.OverlayView();
  activeDistanceOverlay.onAdd = function() {
    const div = document.createElement("div");
    div.className = "distance-callout-overlay";
    div.style.setProperty("--site-color", site.color);
    div.innerHTML = `
      <div class="distance-badge-card">
        <span class="distance-badge-icon">📏</span>
        <span class="distance-badge-title">${road.distance} (${road.driveTime}) from ${road.name}</span>
        <span class="distance-badge-pill">Direct Access</span>
      </div>
    `;
    this.div = div;
    this.getPanes().overlayMouseTarget.appendChild(div);
  };
  activeDistanceOverlay.draw = function() {
    if (!this.div) return;
    const proj = this.getProjection();
    const p = proj.fromLatLngToDivPixel(new google.maps.LatLng(midPoint.lat, midPoint.lng));
    if (p) {
      this.div.style.left = p.x + "px";
      this.div.style.top = (p.y - 36) + "px";
    }
  };
  activeDistanceOverlay.onRemove = function() {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  };
  activeDistanceOverlay.setMap(map);

  // Progressive Trajectory Animation
  let step = 0;
  const totalSteps = fullPath.length;
  const stepInterval = Math.max(80, Math.floor(1000 / totalSteps));

  arrowAnimTimer = setInterval(() => {
    step++;
    const currentSlice = fullPath.slice(0, step);
    if (activeRoadCorePolyline) activeRoadCorePolyline.setPath(currentSlice);
    if (activeRoadGlowPolyline) activeRoadGlowPolyline.setPath(currentSlice);

    if (step >= totalSteps) {
      clearInterval(arrowAnimTimer);
      startNeonRoadPulse(site.color);

      // HOLD FOR 3.5 SECONDS!
      setTimeout(() => {
        if (onReadyForReel) onReadyForReel();
      }, ROAD_DISTANCE_HOLD_MS);
    }
  }, stepInterval);
}

// 60 FPS Neon Road Pulse
function startNeonRoadPulse(color) {
  if (roadPulseAnimFrame) cancelAnimationFrame(roadPulseAnimFrame);

  function pulseLoop() {
    roadPulseAngle += 0.08;
    const pulseOpacity = 0.5 + 0.45 * Math.sin(roadPulseAngle);
    const pulseWeight = 8 + 4 * Math.sin(roadPulseAngle);

    if (activeRoadGlowPolyline) {
      activeRoadGlowPolyline.setOptions({
        strokeOpacity: pulseOpacity,
        strokeWeight: pulseWeight
      });
    }

    roadPulseAnimFrame = requestAnimationFrame(pulseLoop);
  }

  roadPulseAnimFrame = requestAnimationFrame(pulseLoop);
}

function clearBlinkingRoad() {
  if (arrowAnimTimer) {
    clearInterval(arrowAnimTimer);
    arrowAnimTimer = null;
  }
  if (roadPulseAnimFrame) {
    cancelAnimationFrame(roadPulseAnimFrame);
    roadPulseAnimFrame = null;
  }
  if (activeRoadGlowPolyline) {
    activeRoadGlowPolyline.setMap(null);
    activeRoadGlowPolyline = null;
  }
  if (activeRoadCorePolyline) {
    activeRoadCorePolyline.setMap(null);
    activeRoadCorePolyline = null;
  }
  if (activeDistanceOverlay) {
    activeDistanceOverlay.setMap(null);
    activeDistanceOverlay = null;
  }
}

// 6. Autonomous Broadcast Reel Pipeline (Infinite Continuous Loop)
function startAutonomousReelPipeline() {
  if (!isPipelineRunning) return;

  function runSitePipeline(index) {
    if (!isPipelineRunning) return;

    currentSiteIndex = index;
    const targetSite = FEATURED_REEL_SITES[index];
    stageStartTime = Date.now();

    // 1. Update Story Tracker Segments
    updateStorySegments(index, 0);

    // 2. Update Header Telemetry
    const seqCounter = document.getElementById("sequence-counter");
    if (seqCounter) {
      seqCounter.innerText = `PROPERTY ${targetSite.sequenceNumber} OF 5`;
      seqCounter.style.setProperty("--active-site-color", targetSite.color);
    }

    // 3. Highlight Boundaries & Adjacent Zones
    const adjacentNames = targetSite.adjacentZones || [];
    sitePolygons.forEach((poly, idx) => {
      const areaItem = ALL_TUMKUR_SITES[idx];
      if (idx === index) {
        poly.setOptions({
          fillOpacity: 0.55,
          strokeWeight: 3.8,
          strokeOpacity: 1.0,
          zIndex: 50
        });
      } else if (adjacentNames.some(name => areaItem.name.includes(name) || name.includes(areaItem.name))) {
        poly.setOptions({
          fillOpacity: 0.30,
          strokeWeight: 2.2,
          strokeOpacity: 0.9,
          zIndex: 20
        });
      } else {
        poly.setOptions({
          fillOpacity: 0.08,
          strokeWeight: 1.0,
          strokeOpacity: 0.35,
          zIndex: 2
        });
      }
    });

    // Highlight site marker
    document.querySelectorAll(".site-marker-overlay").forEach(m => m.classList.remove("active"));
    const activeMarker = document.getElementById(`site-marker-${index}`);
    if (activeMarker) activeMarker.classList.add("active");

    // 4. STEP 1: Zoom OUT to City Overview (Zoom 12.8)
    map.panTo(CONFIG.DEFAULT_CENTER || { lat: 13.3409, lng: 77.1010 });
    map.setZoom(12.8);

    // STEP 2: 5-SECOND MAP ORIENTATION COUNTDOWN
    let remainingSeconds = 5;
    const adjText = adjacentNames.length > 0 ? ` • Near: ${adjacentNames.join(", ")}` : "";

    function updateCountdownCaption() {
      updateTourBanner(
        `📍 [${remainingSeconds}s] TUMKUR OVERVIEW: ${targetSite.name} (${targetSite.pricePerSqFt})${adjText}`,
        targetSite.color
      );
    }

    updateCountdownCaption();
    const countdownInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds > 0) {
        updateCountdownCaption();
      } else {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Track smooth story progress fill for current segment
    startStoryProgressTicker(index);

    // After 5.0 seconds wide map pause:
    siteStageTimer = setTimeout(() => {
      clearInterval(countdownInterval);
      updateTourBanner(`🚀 APPROACHING: ${targetSite.name} • Tracing Access Route...`, targetSite.color);

      // STEP 3: Smooth Camera Glide Pan
      map.panTo(targetSite.center);

      // STEP 4: Camera Dive to Zoom 17.0
      setTimeout(() => {
        map.setZoom(targetSite.zoom || 17.0);

        // STEP 5: Animate Road-to-Site Curved Arrow (3.5s hold)
        animateRoadToSiteArrow(targetSite, () => {
          // STEP 6: Full-Bleed Walkthrough Video (8.5s)
          openSiteVideoReel(targetSite);

          siteStageTimer = setTimeout(() => {
            closeSiteVideoReel();

            // STEP 7: Loop to Next Site Seamlessly!
            const nextIndex = (index + 1) % FEATURED_REEL_SITES.length;
            runSitePipeline(nextIndex);
          }, REEL_VIDEO_PLAY_MS);
        });
      }, CAMERA_DIVE_MS);
    }, MAP_ORIENTATION_PAUSE_MS);
  }

  // Start with Site 0
  runSitePipeline(0);
}

// 7. Story Segments Progress Tracker
function updateStorySegments(activeIndex, activeFillPercent) {
  for (let i = 0; i < 5; i++) {
    const fillEl = document.getElementById(`story-fill-${i}`);
    if (!fillEl) continue;

    if (i < activeIndex) {
      fillEl.style.width = "100%";
    } else if (i === activeIndex) {
      fillEl.style.width = `${Math.min(100, Math.max(0, activeFillPercent))}%`;
    } else {
      fillEl.style.width = "0%";
    }
  }
}

function startStoryProgressTicker(index) {
  if (storyAnimInterval) clearInterval(storyAnimInterval);

  storyAnimInterval = setInterval(() => {
    const elapsed = Date.now() - stageStartTime;
    const fraction = Math.min(1, elapsed / TOTAL_SITE_DURATION_MS);
    updateStorySegments(index, fraction * 100);

    if (fraction >= 1) {
      clearInterval(storyAnimInterval);
    }
  }, 100);
}

// 8. 9:16 Video Reel Presentation Logic
const reelPanel = document.getElementById("reel-panel");
const reelVideo = document.getElementById("reel-video");

function openSiteVideoReel(site) {
  if (!reelPanel || !reelVideo) return;

  reelPanel.classList.add("open");
  reelPanel.style.setProperty("--active-site-color", site.color);

  // Populate Lower-Third Metadata
  const titleEl = document.getElementById("reel-title");
  const rateEl = document.getElementById("reel-rate-badge");
  const priceEl = document.getElementById("reel-start-price");
  const landmarkEl = document.getElementById("reel-landmark");
  const adjEl = document.getElementById("reel-adjacent-list");
  const highlightsEl = document.getElementById("reel-highlights");

  if (titleEl) titleEl.innerText = `${site.sequenceNumber}. ${site.name}`;
  if (rateEl) rateEl.innerText = site.pricePerSqFt;
  if (priceEl) priceEl.innerText = site.startingPrice;
  if (landmarkEl) landmarkEl.innerText = `📍 ${site.landmark}`;
  if (adjEl) adjEl.innerText = (site.adjacentZones || []).join(" • ");

  if (highlightsEl) {
    highlightsEl.innerHTML = "";
    (site.highlights || []).forEach(tag => {
      const span = document.createElement("span");
      span.className = "highlight-tag";
      span.innerText = tag;
      highlightsEl.appendChild(span);
    });
  }

  // Stream actual walkthrough MP4 video
  reelVideo.pause();
  if (site.videoUrl) {
    reelVideo.src = site.videoUrl;
    reelVideo.muted = isVideoMuted;
    reelVideo.currentTime = 0;

    reelVideo.play().catch(err => {
      console.warn("Autoplay muted policy fallback:", err);
      reelVideo.muted = true;
      isVideoMuted = true;
      reelVideo.play();
    });
  }
}

function closeSiteVideoReel() {
  if (reelPanel) reelPanel.classList.remove("open");
  if (reelVideo) reelVideo.pause();
  clearBlinkingRoad();
}

function updateTourBanner(text, color) {
  const banner = document.getElementById("tour-banner");
  if (!banner) return;
  banner.style.setProperty("--active-site-color", color);
  const textEl = document.getElementById("tour-text");
  if (textEl) textEl.innerText = text;
}

// 9. Silent Keyboard Shortcuts for Creator (Invisible, No UI Buttons)
function setupKeyboardShortcuts() {
  window.addEventListener("keydown", (e) => {
    // Space: Pause / Resume Autonomous Pipeline
    if (e.code === "Space") {
      e.preventDefault();
      isPipelineRunning = !isPipelineRunning;
      if (!isPipelineRunning) {
        clearTimeout(siteStageTimer);
        clearInterval(storyAnimInterval);
        if (reelVideo) reelVideo.pause();
        updateTourBanner("⏸ REEL PIPELINE PAUSED (Press Space to Resume)", "#ef4444");
      } else {
        updateTourBanner("▶ REEL PIPELINE RESUMING...", "#34d399");
        startAutonomousReelPipeline();
      }
    }

    // M: Toggle Audio
    if (e.key === "m" || e.key === "M") {
      isVideoMuted = !isVideoMuted;
      if (reelVideo) reelVideo.muted = isVideoMuted;
    }

    // T: Toggle Map Style (Cinema Dark / Satellite)
    if (e.key === "t" || e.key === "T") {
      if (currentMapMode === "cinema-dark") {
        currentMapMode = "hybrid";
        map.setMapTypeId(google.maps.MapTypeId.HYBRID);
        map.setOptions({ styles: null });
      } else {
        currentMapMode = "cinema-dark";
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        map.setOptions({ styles: CINEMA_DARK_STYLE });
      }
    }
  });
}

window.addEventListener("DOMContentLoaded", loadGoogleMaps);
