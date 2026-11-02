// Tumkur Real Estate Layouts & 5-Site Reel Sequence Configuration
// With Access Roads, Animated Distance Curves & Arrow Trajectories

const FEATURED_REEL_SITES = [
  {
    sequenceNumber: 1,
    id: "pnk-township",
    name: "P.N.K TOWNSHIP",
    fullName: "Sri Balaji Anugraha (P.N.K Zone)",
    subName: "Ashok Nagar & Vijayanagar Main Rd",
    zoneType: "Gated Residential Township",
    pricePerSqFt: "₹1,950 / sq.ft",
    startingPrice: "₹23.40 Lakhs (30x40)",
    color: "#F59E0B", // Warm Amber Gold
    center: { lat: 13.331494, lng: 77.1089739 },
    zoom: 17.0,
    polygon: [
      { lat: 13.3368, lng: 77.1032 },
      { lat: 13.3376, lng: 77.1075 },
      { lat: 13.3370, lng: 77.1142 },
      { lat: 13.3332, lng: 77.1158 },
      { lat: 13.3288, lng: 77.1150 },
      { lat: 13.3262, lng: 77.1102 },
      { lat: 13.3258, lng: 77.1042 },
      { lat: 13.3308, lng: 77.1026 }
    ],
    // Road to Site curved arrow trajectory & distance
    accessRoad: {
      name: "40ft Vijayanagar Main Road",
      distance: "500 Meters",
      driveTime: "1 Min Drive",
      badgeText: "📏 500m (1 Min) from Vijayanagar Main Rd",
      badgePos: { lat: 13.3348, lng: 77.1084 },
      path: [
        { lat: 13.3385, lng: 77.1010 }, // Vijayanagar West Junction
        { lat: 13.3380, lng: 77.1045 },
        { lat: 13.3376, lng: 77.1075 }, // Ashok Nagar curve
        { lat: 13.3345, lng: 77.1085 }, // Approach Road
        { lat: 13.3315, lng: 77.1090 }  // Site Entrance Gate
      ]
    },
    adjacentZones: ["S.S. Puram", "Maruthi Nagar", "Sadashivanagar"],
    videoUrl: "/agent_project/04_Sri_Balaji_Anugraha_Township/reel_walkthrough.mp4",
    landmark: "500m from Vijayanagar Main Rd, Behind Prasanna Dental Clinic, Ashok Nagar",
    plotSizes: "30x40 (1,200 sq.ft) • 40x40 (1,600 sq.ft)",
    approval: "TUDA Approved & RERA Sanctioned",
    description: "Centrally located gated township in Ashok Nagar. 40ft wide internal tar roads, underground drainage, and immediate house construction viability.",
    highlights: ["40ft Asphalt Tar Roads", "Underground Drainage", "Direct Vijayanagar Main Rd", "Immediate Registration"]
  },
  {
    sequenceNumber: 2,
    id: "batawadi-green-meadows",
    name: "BATAWADI JUNCTION",
    fullName: "Green Meadows Smart Township",
    subName: "Batawadi & East Ring Road",
    zoneType: "Gated Residential Township",
    pricePerSqFt: "₹1,850 / sq.ft",
    startingPrice: "₹22.20 Lakhs (30x40)",
    color: "#0284C7", // Ocean Azure
    center: { lat: 13.3340, lng: 77.1320 },
    zoom: 16.8,
    polygon: [
      { lat: 13.3415, lng: 77.1228 },
      { lat: 13.3420, lng: 77.1325 },
      { lat: 13.3395, lng: 77.1395 },
      { lat: 13.3320, lng: 77.1402 },
      { lat: 13.3265, lng: 77.1375 },
      { lat: 13.3270, lng: 77.1290 },
      { lat: 13.3285, lng: 77.1235 },
      { lat: 13.3350, lng: 77.1220 }
    ],
    accessRoad: {
      name: "NH-48 60ft Ring Road Link",
      distance: "300 Meters",
      driveTime: "1 Min Drive",
      badgeText: "📏 300m (1 Min) from NH-48 Highway Artery",
      badgePos: { lat: 13.3370, lng: 77.1330 },
      path: [
        { lat: 13.3425, lng: 77.1345 }, // Batawadi Highway Flyover
        { lat: 13.3385, lng: 77.1338 }, // Service Road Curve
        { lat: 13.3355, lng: 77.1328 },
        { lat: 13.3340, lng: 77.1320 }  // Green Meadows Entrance Gate
      ]
    },
    adjacentZones: ["Kuvempunagara", "Maruthi Nagar", "Kyatsandra"],
    videoUrl: "/agent_project/01_Green_Meadows_Smart_Township/reel_walkthrough.mp4",
    landmark: "2 mins from Batawadi Toll Plaza, Opp. Siddhartha Medical College, near D-Mart",
    plotSizes: "30x40 (1,200 sq.ft) • 30x50 (1,500 sq.ft) • 40x60 (2,400 sq.ft)",
    approval: "TUDA Approved & RERA Registered",
    description: "Strategic east Tumkur location on NH-48 link. 15-acre gated layout with underground utilities, parks, and 80% bank loan approval.",
    highlights: ["2 mins to D-Mart & Toll", "Underground Electricity & UGD", "SBI & HDFC Pre-Approved", "Children's Park"]
  },
  {
    sequenceNumber: 3,
    id: "kuvempunagara-royal-palms",
    name: "KUVEMPUNAGARA",
    fullName: "Royal Palms Luxury Enclave",
    subName: "North-East Elite Villa Enclave",
    zoneType: "Premium Villa Plots",
    pricePerSqFt: "₹2,450 / sq.ft",
    startingPrice: "₹36.75 Lakhs (30x50)",
    color: "#7C3AED", // Royal Iris Violet
    center: { lat: 13.3460, lng: 77.1245 },
    zoom: 16.8,
    polygon: [
      { lat: 13.3548, lng: 77.1175 },
      { lat: 13.3552, lng: 77.1260 },
      { lat: 13.3525, lng: 77.1325 },
      { lat: 13.3450, lng: 77.1330 },
      { lat: 13.3405, lng: 77.1315 },
      { lat: 13.3408, lng: 77.1235 },
      { lat: 13.3435, lng: 77.1180 },
      { lat: 13.3490, lng: 77.1165 }
    ],
    accessRoad: {
      name: "50ft SIT Boulevard Road",
      distance: "400 Meters",
      driveTime: "1 Min Drive",
      badgeText: "📏 400m (1 Min) from SIT College & B.H. Road",
      badgePos: { lat: 13.3435, lng: 77.1215 },
      path: [
        { lat: 13.3410, lng: 77.1165 }, // B.H. Road Junction
        { lat: 13.3430, lng: 77.1200 }, // S.I.T. College Front
        { lat: 13.3450, lng: 77.1228 }, // Boulevard Curve
        { lat: 13.3460, lng: 77.1245 }  // Royal Palms Entrance
      ]
    },
    adjacentZones: ["S.S. Puram", "Batawadi", "Satyamangala"],
    videoUrl: "/agent_project/02_Royal_Palms_Luxury_Enclave/reel_walkthrough.mp4",
    landmark: "3 mins from SIT College, Adjacent to Kuvempu Park & B.H. Road",
    plotSizes: "30x50 (1,500 sq.ft) • 40x60 (2,400 sq.ft) • 50x80 Villa Sites",
    approval: "TUDA Approved, A-Khata Ready",
    description: "Tumkur’s most prestigious residential address! Wide tree-lined boulevards, ornamental palm trees, and ready Cauvery water connections.",
    highlights: ["Elite Gentry Neighborhood", "Walking distance to SIT College", "Cauvery Waterline", "Grand Entrance Arch"]
  },
  {
    sequenceNumber: 4,
    id: "shanti-nagar-lakeview",
    name: "AMANI LAKEVIEW",
    fullName: "Amani Lakeview County",
    subName: "North Lake District (Shanti Nagar)",
    zoneType: "Scenic Waterfront Layout",
    pricePerSqFt: "₹2,100 / sq.ft",
    startingPrice: "₹25.20 Lakhs (30x40)",
    color: "#0891B2", // Marine Teal
    center: { lat: 13.3630, lng: 77.1090 },
    zoom: 16.5,
    polygon: [
      { lat: 13.3765, lng: 77.0975 },
      { lat: 13.3770, lng: 77.1080 },
      { lat: 13.3745, lng: 77.1190 },
      { lat: 13.3660, lng: 77.1215 },
      { lat: 13.3575, lng: 77.1180 },
      { lat: 13.3535, lng: 77.1110 },
      { lat: 13.3540, lng: 77.1015 },
      { lat: 13.3620, lng: 77.0965 },
      { lat: 13.3705, lng: 77.0960 }
    ],
    accessRoad: {
      name: "Lake Promenade Ring Road",
      distance: "600 Meters",
      driveTime: "2 Mins Drive",
      badgeText: "📏 600m (2 Mins) from Railway Station Link",
      badgePos: { lat: 13.3585, lng: 77.1060 },
      path: [
        { lat: 13.3530, lng: 77.1020 }, // City / Railway Link Road
        { lat: 13.3565, lng: 77.1040 }, // Lake Promenade Curve
        { lat: 13.3600, lng: 77.1070 },
        { lat: 13.3630, lng: 77.1090 }  // Lakeview County Gate
      ]
    },
    adjacentZones: ["Satyamangala", "S.S. Puram", "Sadashivanagar"],
    videoUrl: "/agent_project/03_Amani_Lakeview_County/reel_walkthrough.mp4",
    landmark: "Direct Lake Promenade View, 4 mins from Tumkur Railway Station & Bus Stand",
    plotSizes: "30x40 (1,200 sq.ft) • 30x50 (1,500 sq.ft)",
    approval: "TUDA Approved, Clear Title",
    description: "Quiet lakefront residential layout directly facing Amani Kere lake. Crisp fresh air, jogging promenade, and peaceful living inside city limits.",
    highlights: ["Front-Row Lake Promenade", "4 mins to Railway Station", "Zero Noise Pollution", "Clear Marketable Title"]
  },
  {
    sequenceNumber: 5,
    id: "kyatsandra-gateway",
    name: "KYATSANDRA GATEWAY",
    fullName: "Highway Gateway Smart City",
    subName: "Bangalore-Tumkur Expressway Entry",
    zoneType: "Highway Commercial & Residential",
    pricePerSqFt: "₹2,600 / sq.ft",
    startingPrice: "₹31.20 Lakhs (30x40)",
    color: "#DC2626", // Bold Crimson Red
    center: { lat: 13.3160, lng: 77.1430 },
    zoom: 16.5,
    polygon: [
      { lat: 13.3260, lng: 77.1375 },
      { lat: 13.3265, lng: 77.1495 },
      { lat: 13.3215, lng: 77.1570 },
      { lat: 13.3120, lng: 77.1565 },
      { lat: 13.3045, lng: 77.1480 },
      { lat: 13.3050, lng: 77.1370 },
      { lat: 13.3140, lng: 77.1360 },
      { lat: 13.3210, lng: 77.1368 }
    ],
    accessRoad: {
      name: "Bangalore-Tumkur 6-Lane Expressway (NH-48)",
      distance: "100 Meters",
      driveTime: "30 Secs",
      badgeText: "📏 100m (30 Secs) Direct Expressway Flyover Access",
      badgePos: { lat: 13.3135, lng: 77.1475 },
      path: [
        { lat: 13.3080, lng: 77.1550 }, // Tollgate Exit Corridor
        { lat: 13.3120, lng: 77.1500 }, // Cloverleaf Curve
        { lat: 13.3150, lng: 77.1455 },
        { lat: 13.3160, lng: 77.1430 }  // Project Grand Entrance
      ]
    },
    adjacentZones: ["Batawadi", "Maruthi Nagar"],
    videoUrl: "/agent_project/05_Highway_Gateway_Smart_City/reel_walkthrough.mp4",
    landmark: "1 km from Kyatsandra Toll Gate, 3 mins from Siddaganga Math, 45 mins to Peenya",
    plotSizes: "30x40 (1,200 sq.ft) • 30x50 (1,500 sq.ft) • 40x60 Commercial",
    approval: "TUDA & NHAI Approved Highway Frontage",
    description: "High-value commercial and residential plots on the direct entry corridor into Tumkur from Bangalore. 60ft wide approach road with unmatched appreciation.",
    highlights: ["Direct NH-48 Expressway Touch", "45 mins to Bangalore", "Mixed Commercial & Residential", "High ROI Corridor"]
  }
];

// Additional Localities for Full City Cartography
const ADDITIONAL_AREAS = [
  {
    id: "ss-puram",
    name: "S.S. PURAM",
    fullName: "S.S. Puram Commercial Heart",
    pricePerSqFt: "₹3,800 / sq.ft",
    color: "#1A73E8",
    center: { lat: 13.3385, lng: 77.1120 },
    zoom: 16.2,
    polygon: [
      { lat: 13.3448, lng: 77.1040 },
      { lat: 13.3452, lng: 77.1110 },
      { lat: 13.3440, lng: 77.1185 },
      { lat: 13.3392, lng: 77.1190 },
      { lat: 13.3368, lng: 77.1175 },
      { lat: 13.3362, lng: 77.1085 },
      { lat: 13.3368, lng: 77.1032 },
      { lat: 13.3415, lng: 77.1030 }
    ],
    adjacentZones: ["P.N.K TOWNSHIP", "Kuvempunagara", "Sadashivanagar"]
  },
  {
    id: "maruthi-nagar",
    name: "MARUTHI NAGAR",
    fullName: "Panchwati Greens Sector",
    pricePerSqFt: "₹1,750 / sq.ft",
    color: "#EA580C",
    center: { lat: 13.3230, lng: 77.1260 },
    zoom: 16.2,
    polygon: [
      { lat: 13.3282, lng: 77.1150 },
      { lat: 13.3288, lng: 77.1255 },
      { lat: 13.3265, lng: 77.1378 },
      { lat: 13.3205, lng: 77.1390 },
      { lat: 13.3145, lng: 77.1350 },
      { lat: 13.3140, lng: 77.1240 },
      { lat: 13.3155, lng: 77.1155 },
      { lat: 13.3220, lng: 77.1145 }
    ],
    adjacentZones: ["P.N.K TOWNSHIP", "Batawadi", "Shetty Halli"]
  },
  {
    id: "sadashivanagar",
    name: "SADASHIVANAGAR",
    fullName: "Sadashivanagar & Mandipet",
    pricePerSqFt: "₹3,200 / sq.ft",
    color: "#4F46E5",
    center: { lat: 13.3360, lng: 77.0900 },
    zoom: 16.0,
    polygon: [
      { lat: 13.3512, lng: 77.0775 },
      { lat: 13.3518, lng: 77.0910 },
      { lat: 13.3485, lng: 77.1030 },
      { lat: 13.3400, lng: 77.1035 },
      { lat: 13.3320, lng: 77.1025 },
      { lat: 13.3275, lng: 77.0950 },
      { lat: 13.3270, lng: 77.0820 },
      { lat: 13.3390, lng: 77.0765 }
    ],
    adjacentZones: ["P.N.K TOWNSHIP", "S.S. Puram", "Shanti Nagar"]
  },
  {
    id: "satyamangala",
    name: "SATYAMANGALA",
    fullName: "North Star Smart Township",
    pricePerSqFt: "₹1,650 / sq.ft",
    color: "#E11D48",
    center: { lat: 13.3680, lng: 77.1230 },
    zoom: 15.8,
    polygon: [
      { lat: 13.3792, lng: 77.1195 },
      { lat: 13.3798, lng: 77.1290 },
      { lat: 13.3760, lng: 77.1365 },
      { lat: 13.3640, lng: 77.1370 },
      { lat: 13.3545, lng: 77.1345 },
      { lat: 13.3540, lng: 77.1240 },
      { lat: 13.3585, lng: 77.1195 },
      { lat: 13.3690, lng: 77.1185 }
    ],
    adjacentZones: ["Shanti Nagar", "Kuvempunagara", "Oorukere"]
  },
  {
    id: "jayanagar-south",
    name: "JAYANAGAR SOUTH",
    fullName: "Siddaganga Serene Valley",
    pricePerSqFt: "₹1,900 / sq.ft",
    color: "#059669",
    center: { lat: 13.3150, lng: 77.1100 },
    zoom: 16.0,
    polygon: [
      { lat: 13.3268, lng: 77.1040 },
      { lat: 13.3275, lng: 77.1150 },
      { lat: 13.3210, lng: 77.1160 },
      { lat: 13.3135, lng: 77.1165 },
      { lat: 13.3045, lng: 77.1145 },
      { lat: 13.3040, lng: 77.1065 },
      { lat: 13.3110, lng: 77.1025 },
      { lat: 13.3195, lng: 77.1030 }
    ],
    adjacentZones: ["P.N.K TOWNSHIP", "Shetty Halli", "Maruthi Nagar"]
  },
  {
    id: "oorukere",
    name: "OORUKERE (NH-48)",
    fullName: "Swarna Paradise Mega City",
    pricePerSqFt: "₹1,450 / sq.ft",
    color: "#3B82F6",
    center: { lat: 13.3950, lng: 77.1030 },
    zoom: 14.8,
    polygon: [
      { lat: 13.4115, lng: 77.0895 },
      { lat: 13.4120, lng: 77.1065 },
      { lat: 13.4075, lng: 77.1195 },
      { lat: 13.3910, lng: 77.1200 },
      { lat: 13.3795, lng: 77.1155 },
      { lat: 13.3790, lng: 77.0980 },
      { lat: 13.3885, lng: 77.0885 },
      { lat: 13.4010, lng: 77.0880 }
    ],
    adjacentZones: ["Satyamangala", "Shanti Nagar"]
  },
  {
    id: "shetty-halli",
    name: "SHETTY HALLI",
    fullName: "Silver Oak Eco Orchard",
    pricePerSqFt: "₹1,250 / sq.ft",
    color: "#0D9488",
    center: { lat: 13.3080, lng: 77.1240 },
    zoom: 15.8,
    polygon: [
      { lat: 13.3155, lng: 77.1152 },
      { lat: 13.3160, lng: 77.1265 },
      { lat: 13.3145, lng: 77.1365 },
      { lat: 13.3060, lng: 77.1375 },
      { lat: 13.2990, lng: 77.1315 },
      { lat: 13.2985, lng: 77.1210 },
      { lat: 13.3040, lng: 77.1150 },
      { lat: 13.3105, lng: 77.1145 }
    ],
    adjacentZones: ["Jayanagar South", "Maruthi Nagar"]
  }
];

const ALL_TUMKUR_SITES = [...FEATURED_REEL_SITES, ...ADDITIONAL_AREAS];
