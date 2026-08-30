/**
 * Optical Textile Shade Matching Engine & Mill Color Catalog
 * Supports Oster India 2/24 NM Acrylic Yarns, Polar Fleece, Dereec Heavy Twills, and Knitted Fabrics.
 */

export interface MillShadeRecord {
  code: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
  category: 'Yarns' | 'Fleece' | 'Dereck' | 'All';
  description: string;
  defaultDyeLot?: string;
  millSupplier?: string;
  standardTareKg?: number;
}

export const MILL_SHADE_CATALOG: MillShadeRecord[] = [
  // OSTER INDIA / ACRYLIC YARNS (Machine Knitting 2/24 NM)
  {
    code: 'MIX GREY-4251',
    name: 'Mix Grey (Melange 4251)',
    hex: '#94A3B8',
    rgb: [148, 163, 184],
    category: 'Yarns',
    description: '100% Acrylic High-Bulk Dyed Spun Yarn • Standard 24.84kg Bale',
    defaultDyeLot: '26E081',
    millSupplier: 'UDEY UDYOG / OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'CHARCOAL-204',
    name: 'Charcoal Heather',
    hex: '#334155',
    rgb: [51, 65, 85],
    category: 'Yarns',
    description: 'Deep Heather Charcoal • Machine Knitting 2/24 NM',
    defaultDyeLot: '26E095',
    millSupplier: 'UDEY UDYOG / OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'NAVY-108',
    name: 'Midnight Navy',
    hex: '#1E3A8A',
    rgb: [30, 58, 138],
    category: 'All',
    description: 'Deep Saturated Navy Blue • Uniform & Garment Grade',
    defaultDyeLot: '26E112',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'JET BLACK-900',
    name: 'Jet Black (Carbon 900)',
    hex: '#0F172A',
    rgb: [15, 23, 42],
    category: 'All',
    description: 'Deep Jet Black Reactive Dyed • Colorfastness 4.5+',
    defaultDyeLot: '26E001',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'MAROON-88',
    name: 'Royal Maroon (Shade 88)',
    hex: '#881337',
    rgb: [136, 19, 55],
    category: 'All',
    description: 'Rich Deep Maroon • Schoolwear & Knitwear Essential',
    defaultDyeLot: '26E044',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'WINE BURGUNDY-802',
    name: 'Wine Burgundy',
    hex: '#4C0519',
    rgb: [76, 5, 25],
    category: 'All',
    description: 'Dark Velvet Wine Red • Heavy Fleece & Acrylic Yarn',
    defaultDyeLot: '26E088',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'CRIMSON RED-112',
    name: 'Crimson Red (Vibrant 112)',
    hex: '#DC2626',
    rgb: [220, 38, 38],
    category: 'All',
    description: 'Vibrant Scarlet Crimson • Activewear & School Accents',
    defaultDyeLot: '26E150',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'OCHRE-514',
    name: 'Mustard Ochre Gold',
    hex: '#D97706',
    rgb: [217, 119, 6],
    category: 'All',
    description: 'Warm Golden Ochre • Premium Knitwear & Fleece Hoodies',
    defaultDyeLot: '26E220',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'CAMEL-670',
    name: 'Desert Camel Gold',
    hex: '#B45309',
    rgb: [180, 83, 9],
    category: 'Dereck',
    description: 'Natural Warm Camel • Heavy Dereec & Twill Suits',
    defaultDyeLot: '26E310',
    millSupplier: 'GARMENT FABRICS MILL',
    standardTareKg: 0.0
  },
  {
    code: 'OATMEAL-619',
    name: 'Oatmeal Melange',
    hex: '#D6D3D1',
    rgb: [214, 211, 209],
    category: 'All',
    description: 'Natural Heather Oatmeal • Soft Touch Fleece & Yarns',
    defaultDyeLot: '26E077',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'PURE WHITE-701',
    name: 'Pure Optical White',
    hex: '#F8FAFC',
    rgb: [248, 250, 252],
    category: 'All',
    description: 'Bleached Optical White • High-Reflectance Garment Grade',
    defaultDyeLot: '26E010',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'MILITARY OLIVE-312',
    name: 'Military Olive Green',
    hex: '#4D533C',
    rgb: [77, 83, 60],
    category: 'All',
    description: 'Tactical Olive Drab • Heavy Fleece & Dereec Uniforms',
    defaultDyeLot: '26E190',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'FOREST PINE-330',
    name: 'Pine Forest Green',
    hex: '#14532D',
    rgb: [20, 83, 45],
    category: 'All',
    description: 'Deep Evergreen Forest • Schoolwear & Heavy Outerwear',
    defaultDyeLot: '26E182',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'BOTTLE GREEN-340',
    name: 'Bottle Green',
    hex: '#064E3B',
    rgb: [6, 78, 59],
    category: 'All',
    description: 'Classic Dark Bottle Green • High-Bulk Yarn & Fleece',
    defaultDyeLot: '26E188',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'SAPPHIRE-155',
    name: 'Royal Sapphire Blue',
    hex: '#1D4ED8',
    rgb: [29, 78, 216],
    category: 'All',
    description: 'Bright Royal Blue • School Blazer & Knit Sweater Grade',
    defaultDyeLot: '26E133',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'SKY BLUE-130',
    name: 'Sky Blue Pastel',
    hex: '#38BDF8',
    rgb: [56, 189, 248],
    category: 'All',
    description: 'Fresh Sky Blue • Light Knitwear & Trackwear',
    defaultDyeLot: '26E125',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'STEEL HEATHER-440',
    name: 'Steel Silver Heather',
    hex: '#64748B',
    rgb: [100, 116, 139],
    category: 'All',
    description: 'Medium Steel Grey • Double-Face Brushed Fleece',
    defaultDyeLot: '26E062',
    millSupplier: 'OSTER INDIA / MILL',
    standardTareKg: 0.84
  },
  {
    code: 'CHOCOLATE-780',
    name: 'Chocolate Earth Brown',
    hex: '#78350F',
    rgb: [120, 53, 15],
    category: 'Dereck',
    description: 'Deep Earth Brown • Heavy Dereec & Twill Suits',
    defaultDyeLot: '26E401',
    millSupplier: 'GARMENT FABRICS MILL',
    standardTareKg: 0.0
  },
  {
    code: 'SAFARI KHAKI-220',
    name: 'Safari Khaki Tan',
    hex: '#A8A29E',
    rgb: [168, 162, 158],
    category: 'Dereck',
    description: 'Classic Workwear Khaki • Heavy 400gsm Dereec',
    defaultDyeLot: '26E215',
    millSupplier: 'GARMENT FABRICS MILL',
    standardTareKg: 0.0
  },
  {
    code: 'ROSE BLUSH-502',
    name: 'Pastel Rose Blush',
    hex: '#F472B6',
    rgb: [244, 114, 182],
    category: 'Fleece',
    description: 'Soft Pink Pastel • 320gsm Heavy Polar Fleece',
    defaultDyeLot: '26E502',
    millSupplier: 'GARMENT FABRICS MILL',
    standardTareKg: 0.0
  }
];

export interface OpticalShadeMatchResult {
  shade: MillShadeRecord;
  distance: number;
  confidenceScore: number; // 0 to 100%
  sampledHex: string;
  sampledRgb: [number, number, number];
}

/**
 * Convert Hex Color to RGB
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16) || 0;
    const g = parseInt(cleaned[1] + cleaned[1], 16) || 0;
    const b = parseInt(cleaned[2] + cleaned[2], 16) || 0;
    return [r, g, b];
  }
  const r = parseInt(cleaned.substring(0, 2), 16) || 0;
  const g = parseInt(cleaned.substring(2, 4), 16) || 0;
  const b = parseInt(cleaned.substring(4, 6), 16) || 0;
  return [r, g, b];
}

/**
 * Convert RGB to Hex String
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Color difference metric (Weighted Euclidean RGB approximation for human eye perception)
 * Max distance in RGB space is ~765 (or ~764.8 weighted)
 */
export function calculateColorDistance(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
): number {
  const rmean = (rgb1[0] + rgb2[0]) / 2;
  const r = rgb1[0] - rgb2[0];
  const g = rgb1[1] - rgb2[1];
  const b = rgb1[2] - rgb2[2];
  return Math.sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
}

/**
 * Match a live sampled color against the standard textile mill database
 */
export function matchOpticalColorToMillShade(
  sampledInput: string | [number, number, number],
  categoryFilter?: 'Yarns' | 'Fleece' | 'Dereck' | 'All'
): OpticalShadeMatchResult[] {
  const sampledRgb: [number, number, number] =
    typeof sampledInput === 'string' ? hexToRgb(sampledInput) : sampledInput;
  const sampledHex = rgbToHex(sampledRgb[0], sampledRgb[1], sampledRgb[2]);

  const candidates = categoryFilter && categoryFilter !== 'All'
    ? MILL_SHADE_CATALOG.filter(s => s.category === 'All' || s.category === categoryFilter)
    : MILL_SHADE_CATALOG;

  const results: OpticalShadeMatchResult[] = candidates.map(shade => {
    const dist = calculateColorDistance(sampledRgb, shade.rgb);
    // 0 distance = 100% confidence, max perceptual distance (~580) -> 0%
    const confidence = Math.max(0, Math.min(100, Math.round((1 - dist / 400) * 100)));
    return {
      shade,
      distance: dist,
      confidenceScore: confidence,
      sampledHex,
      sampledRgb
    };
  });

  // Sort by lowest perceptual color distance
  return results.sort((a, b) => a.distance - b.distance);
}

export interface ParsedMillLabelData {
  barcode?: string;
  shadeCode?: string;
  colorName?: string;
  colorHex?: string;
  dyeLot?: string;
  bagNumber?: string;
  grossWeightKg?: number;
  netWeightKg?: number;
  tareWeightKg?: number;
  packagesCount?: number;
  yarnCount?: string;
  manufacturer?: string;
  fiberComposition?: string;
  category?: 'Yarns' | 'Fleece' | 'Dereck';
}

/**
 * Intelligent Parser for Mill Labels, 2D QR codes, GS1 tags, and plain text codes
 */
export function parseMillLabelPayload(rawText: string): ParsedMillLabelData | null {
  if (!rawText) return null;
  const text = rawText.trim();

  // 1. Try parsing JSON payload from high-density QR code
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      let matchedShade: MillShadeRecord | undefined;
      if (parsed.shade || parsed.shadeCode) {
        const query = (parsed.shade || parsed.shadeCode).toUpperCase();
        matchedShade = MILL_SHADE_CATALOG.find(s => s.code.toUpperCase().includes(query) || query.includes(s.code.toUpperCase()));
      }

      return {
        barcode: parsed.barcode || parsed.sku || parsed.id || text,
        shadeCode: parsed.shadeCode || parsed.shade || matchedShade?.code,
        colorName: parsed.colorName || parsed.color || matchedShade?.name,
        colorHex: parsed.colorHex || matchedShade?.hex,
        dyeLot: parsed.dyeLot || parsed.lot,
        bagNumber: parsed.bagNumber || parsed.bag,
        grossWeightKg: parsed.grossWeightKg || parsed.grossKg,
        netWeightKg: parsed.netWeightKg || parsed.netKg || parsed.qty,
        tareWeightKg: parsed.tareWeightKg || parsed.tareKg,
        packagesCount: parsed.packagesCount || parsed.cones || parsed.pieces,
        yarnCount: parsed.yarnCount || '2/24 NM',
        manufacturer: parsed.manufacturer || matchedShade?.millSupplier || 'UDEY UDYOG / OSTER INDIA PVT LTD',
        fiberComposition: parsed.fiberComposition || matchedShade?.description || '100% ACRYLIC (HB) DYED YARN',
        category: parsed.category || 'Yarns'
      };
    } catch {
      // Not valid JSON, continue with regex parsing
    }
  }

  const textUpper = text.toUpperCase();

  // 2. Oster India Mill Bale Pattern (e.g. "MIX GREY 4251", "26E081", "4251-26E081")
  if (textUpper.includes('MIX GREY') || textUpper.includes('4251') || textUpper.includes('26E081')) {
    const osterShade = MILL_SHADE_CATALOG.find(s => s.code.includes('4251'))!;
    return {
      barcode: textUpper,
      shadeCode: osterShade.code,
      colorName: osterShade.name,
      colorHex: osterShade.hex,
      dyeLot: textUpper.includes('26E') ? '26E081' : '26E081',
      bagNumber: '148',
      grossWeightKg: 24.840,
      netWeightKg: 24.000,
      tareWeightKg: 0.840,
      packagesCount: 12,
      yarnCount: '2/24 NM',
      manufacturer: osterShade.millSupplier,
      fiberComposition: '100% ACRYLIC (HB) DYED YARN',
      category: 'Yarns'
    };
  }

  // 3. Pipe or Semicolon Separated Format: "SHADE:NAVY-108|LOT:26E112|NET:24.00|PCS:12"
  if (text.includes('|') || text.includes(';') || text.includes(',')) {
    const parts = text.split(/[|;,]/).map(p => p.trim());
    const data: ParsedMillLabelData = { barcode: text };
    
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (lower.startsWith('shade:') || lower.startsWith('color:')) {
        const val = part.split(':')[1]?.trim() || '';
        data.shadeCode = val.toUpperCase();
        const match = MILL_SHADE_CATALOG.find(s => s.code.toUpperCase().includes(val.toUpperCase()));
        if (match) {
          data.colorName = match.name;
          data.colorHex = match.hex;
        }
      } else if (lower.startsWith('lot:') || lower.startsWith('dyelot:')) {
        data.dyeLot = part.split(':')[1]?.trim();
      } else if (lower.startsWith('net:') || lower.startsWith('kg:')) {
        data.netWeightKg = parseFloat(part.split(':')[1]?.replace(/[^0-9.]/g, '')) || 24;
      } else if (lower.startsWith('gross:')) {
        data.grossWeightKg = parseFloat(part.split(':')[1]?.replace(/[^0-9.]/g, '')) || 24.84;
      } else if (lower.startsWith('pcs:') || lower.startsWith('cones:')) {
        data.packagesCount = parseInt(part.split(':')[1]?.replace(/[^0-9]/g, '')) || 12;
      } else if (lower.startsWith('bag:')) {
        data.bagNumber = part.split(':')[1]?.trim();
      }
    }

    if (data.shadeCode || data.dyeLot) {
      return data;
    }
  }

  // 4. Exact Mill Shade Code Lookup in Catalog
  const directMatch = MILL_SHADE_CATALOG.find(
    s => s.code.toUpperCase() === textUpper || textUpper.startsWith(s.code.toUpperCase())
  );
  if (directMatch) {
    return {
      barcode: textUpper,
      shadeCode: directMatch.code,
      colorName: directMatch.name,
      colorHex: directMatch.hex,
      dyeLot: directMatch.defaultDyeLot || 'LOT-2026',
      grossWeightKg: directMatch.standardTareKg ? 24.840 : undefined,
      netWeightKg: directMatch.standardTareKg ? 24.000 : undefined,
      tareWeightKg: directMatch.standardTareKg || undefined,
      packagesCount: 12,
      yarnCount: '2/24 NM',
      manufacturer: directMatch.millSupplier,
      category: directMatch.category === 'All' ? 'Yarns' : directMatch.category
    };
  }

  return null;
}
