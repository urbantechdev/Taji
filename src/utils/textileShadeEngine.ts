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
  // Commercial Invoice UU/OI-EX-036/25-26 & Packing List (Udey Udyog Unit of Oster India)
  {
    code: 'BLACK 3061',
    name: 'Black 3061',
    hex: '#0a0a0a',
    rgb: [10, 10, 10],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26B020 (28 Bags / 669.400 kg)',
    defaultDyeLot: '26B020',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'MAROON-3059',
    name: 'Maroon 3059',
    hex: '#7f1d1d',
    rgb: [127, 29, 29],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26C002 (106 Bags / 2,532.200 kg)',
    defaultDyeLot: '26C002',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'GREEN-4551',
    name: 'Green 4551',
    hex: '#14532d',
    rgb: [20, 83, 45],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26C007 (62 Bags / 1,483.300 kg)',
    defaultDyeLot: '26C007',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'NEW NAVY-3075',
    name: 'New Navy 3075',
    hex: '#1e3a8a',
    rgb: [30, 58, 138],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26C001 (137 Bags / 3,284.800 kg)',
    defaultDyeLot: '26C001',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'RED-3025',
    name: 'Red 3025',
    hex: '#dc2626',
    rgb: [220, 38, 38],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26C003 (62 Bags / 1,483.400 kg)',
    defaultDyeLot: '26C003',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'NAVY KK',
    name: 'Navy KK',
    hex: '#0f172a',
    rgb: [15, 23, 42],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26C006 (45 Bags / 1,060.800 kg)',
    defaultDyeLot: '26C006',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'BEIGE-4930',
    name: 'Beige 4930',
    hex: '#d4b996',
    rgb: [212, 185, 150],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26C004 (15 Bags / 354.200 kg)',
    defaultDyeLot: '26C004',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'ASKARI OLIVE',
    name: 'Askari Olive',
    hex: '#4d5d36',
    rgb: [77, 93, 54],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26C010 (15 Bags / 347.600 kg)',
    defaultDyeLot: '26C010',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'BROWN-4412',
    name: 'Brown 4412',
    hex: '#5c3a21',
    rgb: [92, 58, 33],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26C005 (14 Bags / 325.700 kg)',
    defaultDyeLot: '26C005',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'NAVY-4515M',
    name: 'Navy 4515M (Melange)',
    hex: '#1d2d44',
    rgb: [29, 45, 68],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26C009 (45 Bags / 1,063.200 kg)',
    defaultDyeLot: '26C009',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
  {
    code: 'BLACK (26C008)',
    name: 'Black (26C008)',
    hex: '#050505',
    rgb: [5, 5, 5],
    category: 'Yarns',
    description: '2/24 NM Acrylic High Bulk Yarn • Lot 26C008 (14 Bags / 336.000 kg)',
    defaultDyeLot: '26C008',
    millSupplier: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
    standardTareKg: 0.84
  },
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

  // 2. Full Multi-line Mill Label Optical / OCR Text Parser (e.g. Oster India / Udey Udyog bag labels)
  // Handles OCR dumps like:
  // "MANUFACTURER: UDEY UDYOG UNIT OF OSTER INDIA PVT LTD"
  // "DESCRIPTION: 100% ACRYLIC (HB) DYED YARN"
  // "LINER DENSITY IN TEX UNIT:- 83"
  // "NO OF PAKAGES :- 12"
  // "TYPE OF YARN :- MACHINE KNITTING"
  // "COUNT :- 2/24NM"
  // "LOT NO:- 26E081"
  // "SHADE :- MIX GREY-4251"
  // "NET MASS :- 24.000KGS"
  // "GROSS MASS :- 24.840KGS"
  // "BAG NO :- 148"
  if (textUpper.includes('LOT NO') || textUpper.includes('SHADE') || textUpper.includes('NET MASS') || textUpper.includes('GROSS MASS')) {
    const lotMatch = textUpper.match(/LOT\s*(?:NO)?\s*[:\-]+\s*([A-Z0-9\-]+)/i);
    const shadeMatch = textUpper.match(/SHADE\s*[:\-]+\s*([A-Z0-9\s\-]+?)(?=\s+(?:NET|GROSS|BAG|COUNT|NO|\n|$))/i);
    const netMassMatch = textUpper.match(/NET\s*(?:MASS|WT|WEIGHT)?\s*[:\-]+\s*([0-9.]+)\s*(?:KGS?|KG)?/i);
    const grossMassMatch = textUpper.match(/GROSS\s*(?:MASS|WT|WEIGHT)?\s*[:\-]+\s*([0-9.]+)\s*(?:KGS?|KG)?/i);
    const bagMatch = textUpper.match(/BAG\s*(?:NO)?\s*[:\-]+\s*([A-Z0-9\-]+)/i);
    const countMatch = textUpper.match(/COUNT\s*[:\-]+\s*([0-9/]+NM|[0-9/]+)/i);
    const packagesMatch = textUpper.match(/(?:NO\s*OF\s*)?PA?C?KAGES\s*[:\-]+\s*([0-9]+)/i);

    const parsedShadeCode = shadeMatch ? shadeMatch[1].trim() : (textUpper.includes('MIX GREY') || textUpper.includes('4251') ? 'MIX GREY-4251' : undefined);
    const parsedLotNo = lotMatch ? lotMatch[1].trim() : (textUpper.includes('26E081') ? '26E081' : undefined);
    const netWeight = netMassMatch ? parseFloat(netMassMatch[1]) : 24.000;
    const grossWeight = grossMassMatch ? parseFloat(grossMassMatch[1]) : 24.840;
    const tareWeight = Number((grossWeight - netWeight).toFixed(3));
    const bagNo = bagMatch ? bagMatch[1].trim() : '148';
    const pkgCount = packagesMatch ? parseInt(packagesMatch[1], 10) : 12;
    const yCount = countMatch ? countMatch[1].trim() : '2/24 NM';

    let matchedShade: MillShadeRecord | undefined;
    if (parsedShadeCode) {
      matchedShade = MILL_SHADE_CATALOG.find(s => s.code.toUpperCase().includes(parsedShadeCode.toUpperCase()) || parsedShadeCode.toUpperCase().includes(s.code.toUpperCase()));
    }

    return {
      barcode: parsedShadeCode || parsedLotNo || textUpper,
      shadeCode: parsedShadeCode || matchedShade?.code || 'MIX GREY-4251',
      colorName: matchedShade?.name || 'Mix Grey (Melange 4251)',
      colorHex: matchedShade?.hex || '#94A3B8',
      dyeLot: parsedLotNo || matchedShade?.defaultDyeLot || '26E081',
      bagNumber: bagNo,
      grossWeightKg: grossWeight,
      netWeightKg: netWeight,
      tareWeightKg: tareWeight,
      packagesCount: pkgCount,
      yarnCount: yCount,
      manufacturer: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
      fiberComposition: '100% ACRYLIC (HB) DYED YARN',
      category: 'Yarns'
    };
  }

  // 3. Oster India Mill Bale Pattern (Single scan of e.g. "MIX GREY-4251", "26E081", "4251-26E081")
  if (textUpper.includes('MIX GREY') || textUpper.includes('4251') || textUpper.includes('26E081')) {
    const osterShade = MILL_SHADE_CATALOG.find(s => s.code.includes('4251'))!;
    return {
      barcode: textUpper,
      shadeCode: osterShade.code,
      colorName: osterShade.name,
      colorHex: osterShade.hex,
      dyeLot: textUpper.includes('26E') ? textUpper : (osterShade.defaultDyeLot || '26E081'),
      bagNumber: '148',
      grossWeightKg: 24.840,
      netWeightKg: 24.000,
      tareWeightKg: 0.840,
      packagesCount: 12,
      yarnCount: '2/24 NM',
      manufacturer: osterShade.millSupplier || 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
      fiberComposition: '100% ACRYLIC (HB) DYED YARN',
      category: 'Yarns'
    };
  }

  // 4. Any Dye Lot barcode format starting with 26E (e.g. 26E095, 26E112)
  if (/^26E\d{3,}$/i.test(textUpper.trim())) {
    const matchedByLot = MILL_SHADE_CATALOG.find(s => s.defaultDyeLot?.toUpperCase() === textUpper.trim());
    return {
      barcode: textUpper,
      shadeCode: matchedByLot?.code || 'OSTER-YARN',
      colorName: matchedByLot?.name || `Acrylic Yarn (Lot ${textUpper})`,
      colorHex: matchedByLot?.hex || '#94A3B8',
      dyeLot: textUpper.trim(),
      grossWeightKg: 24.840,
      netWeightKg: 24.000,
      tareWeightKg: 0.840,
      packagesCount: 12,
      yarnCount: '2/24 NM',
      manufacturer: 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
      fiberComposition: '100% ACRYLIC (HB) DYED YARN',
      category: 'Yarns'
    };
  }

  // 5. Delimited Format (Pipe, Semicolon, Comma, Slash): e.g. "SHADE:NAVY-108|LOT:26E112|NET:24.00|PCS:12" or "LOT:26E081/SHADE:MIX GREY-4251/MASS:24.00KG"
  if (text.includes('|') || text.includes(';') || text.includes(',') || (text.includes('/') && (textUpper.includes('LOT') || textUpper.includes('SHADE') || textUpper.includes('MASS') || textUpper.includes('NET')))) {
    const parts = text.split(/[|;,/]/).map(p => p.trim()).filter(Boolean);
    const data: ParsedMillLabelData = { barcode: text };
    
    for (const part of parts) {
      const lower = part.toLowerCase();
      const delimiter = part.includes(':') ? ':' : (part.includes('=') ? '=' : (part.includes('-') && (lower.startsWith('lot-') || lower.startsWith('shade-') || lower.startsWith('mass-')) ? '-' : ' '));
      const chunks = part.split(delimiter);
      const key = chunks[0]?.trim().toLowerCase();
      const val = chunks.slice(1).join(delimiter)?.trim() || '';

      if (key.includes('shade') || key.includes('color') || key.includes('colour')) {
        data.shadeCode = val.toUpperCase();
        const match = MILL_SHADE_CATALOG.find(s => s.code.toUpperCase().includes(val.toUpperCase()) || val.toUpperCase().includes(s.code.toUpperCase()));
        if (match) {
          data.colorName = match.name;
          data.colorHex = match.hex;
        }
      } else if (key.includes('lot') || key.includes('dyelot')) {
        data.dyeLot = val.toUpperCase();
      } else if (key.includes('mass') || key.includes('net') || key.includes('weight') || key.includes('kg') || key.includes('qty')) {
        data.netWeightKg = parseFloat(val.replace(/[^0-9.]/g, '')) || 24;
      } else if (key.includes('gross')) {
        data.grossWeightKg = parseFloat(val.replace(/[^0-9.]/g, '')) || 24.84;
      } else if (key.includes('pcs') || key.includes('cones') || key.includes('package')) {
        data.packagesCount = parseInt(val.replace(/[^0-9]/g, '')) || 12;
      } else if (key.includes('bag')) {
        data.bagNumber = val;
      }
    }

    if (data.shadeCode || data.dyeLot || data.netWeightKg) {
      if (data.netWeightKg && !data.grossWeightKg) {
        data.grossWeightKg = Number((data.netWeightKg + 0.84).toFixed(3));
        data.tareWeightKg = 0.84;
      }
      return data;
    }
  }

  // 6. Intelligent Query & Shade Number lookup (e.g. "4251", "3059", "MIX GREY", "26E081")
  const queryMatch = findMillShadeByQuery(textUpper);
  if (queryMatch) {
    return {
      barcode: textUpper,
      shadeCode: queryMatch.code,
      colorName: queryMatch.name,
      colorHex: queryMatch.hex,
      dyeLot: queryMatch.defaultDyeLot || (textUpper.startsWith('LOT-') ? textUpper : 'LOT-2026'),
      grossWeightKg: queryMatch.standardTareKg ? 24.840 : undefined,
      netWeightKg: queryMatch.standardTareKg ? 24.000 : undefined,
      tareWeightKg: queryMatch.standardTareKg || undefined,
      packagesCount: 12,
      yarnCount: '2/24 NM',
      manufacturer: queryMatch.millSupplier || 'UDEY UDYOG UNIT OF OSTER INDIA PVT LTD',
      fiberComposition: '100% ACRYLIC (HB) DYED YARN',
      category: queryMatch.category === 'All' ? 'Yarns' : queryMatch.category
    };
  }

  return null;
}

/**
 * Intelligent Shade Search & Autofill Resolver
 * Matches by full code, numeric suffix (e.g. '4251' -> 'MIX GREY-4251', '3059' -> 'MAROON-3059'),
 * dye lot ('26E081'), or color name ('mix grey', 'maroon').
 */
export function findMillShadeByQuery<T extends { code: string; name?: string; defaultDyeLot?: string; hex?: string; category?: string }>(
  query: string,
  catalog: T[] = MILL_SHADE_CATALOG as unknown as T[]
): T | undefined {
  if (!query) return undefined;
  const raw = query.trim();
  if (!raw) return undefined;
  const qUpper = raw.toUpperCase();
  const digitsOnly = raw.replace(/\D/g, '');

  // 1. Exact Code match
  const exact = catalog.find(s => s.code.toUpperCase() === qUpper);
  if (exact) return exact;

  // 2. Exact Dye Lot match
  const lotMatch = catalog.find(s => s.defaultDyeLot && s.defaultDyeLot.toUpperCase() === qUpper);
  if (lotMatch) return lotMatch;

  // 3. Numeric Suffix / Code Number match (e.g. '4251' in 'MIX GREY-4251', '3059' in 'MAROON-3059')
  if (digitsOnly.length >= 2) {
    // Check if code contains digits as distinct token or suffix
    const exactNumericToken = catalog.find(s => {
      const codeUpper = s.code.toUpperCase();
      if (codeUpper.endsWith(`-${digitsOnly}`) || codeUpper.endsWith(` ${digitsOnly}`)) return true;
      const parts = codeUpper.split(/[- ]+/);
      return parts.includes(digitsOnly);
    });
    if (exactNumericToken) return exactNumericToken;

    // Check if default dye lot matches or ends with digits
    const lotNumeric = catalog.find(s => s.defaultDyeLot && s.defaultDyeLot.replace(/\D/g, '').endsWith(digitsOnly));
    if (lotNumeric && digitsOnly.length >= 3) return lotNumeric;

    // Check if code contains digits anywhere
    const containsDigits = catalog.find(s => s.code.toUpperCase().includes(digitsOnly));
    if (containsDigits && digitsOnly.length >= 3) return containsDigits;
  }

  // 4. Code starts with query (e.g. 'MIX' -> 'MIX GREY-4251')
  if (qUpper.length >= 3) {
    const startsWithCode = catalog.find(s => s.code.toUpperCase().startsWith(qUpper));
    if (startsWithCode) return startsWithCode;
  }

  // 5. Exact Color Name match
  const exactName = catalog.find(s => s.name && s.name.toUpperCase() === qUpper);
  if (exactName) return exactName;

  // 6. Color Name starts with or includes query
  if (qUpper.length >= 3) {
    const nameMatch = catalog.find(s => s.name && s.name.toUpperCase().startsWith(qUpper));
    if (nameMatch) return nameMatch;
    const codeIncludes = catalog.find(s => s.code.toUpperCase().includes(qUpper));
    if (codeIncludes) return codeIncludes;
    const nameIncludes = catalog.find(s => s.name && s.name.toUpperCase().includes(qUpper));
    if (nameIncludes) return nameIncludes;
  }

  return undefined;
}

/**
 * Multi-result search filter for dropdown autocomplete
 */
export function searchMillShades<T extends { code: string; name?: string; defaultDyeLot?: string; hex?: string; category?: string }>(
  query: string,
  catalog: T[] = MILL_SHADE_CATALOG as unknown as T[],
  limit = 16
): T[] {
  if (!query || !query.trim()) return catalog.slice(0, limit);
  const qUpper = query.trim().toUpperCase();
  const digitsOnly = query.replace(/\D/g, '');

  const results: { item: T; score: number }[] = [];

  for (const item of catalog) {
    const codeUpper = item.code.toUpperCase();
    const nameUpper = (item.name || '').toUpperCase();
    const lotUpper = (item.defaultDyeLot || '').toUpperCase();
    let score = 0;

    if (codeUpper === qUpper) {
      score = 1000;
    } else if (lotUpper === qUpper) {
      score = 900;
    } else if (digitsOnly.length >= 2 && (codeUpper.endsWith(`-${digitsOnly}`) || codeUpper.endsWith(` ${digitsOnly}`))) {
      score = 850;
    } else if (digitsOnly.length >= 2 && codeUpper.split(/[- ]+/).includes(digitsOnly)) {
      score = 800;
    } else if (codeUpper.startsWith(qUpper)) {
      score = 700;
    } else if (nameUpper.startsWith(qUpper)) {
      score = 600;
    } else if (codeUpper.includes(qUpper)) {
      score = 500;
    } else if (nameUpper.includes(qUpper)) {
      score = 400;
    } else if (digitsOnly.length >= 3 && (codeUpper.includes(digitsOnly) || lotUpper.includes(digitsOnly))) {
      score = 350;
    }

    if (score > 0) {
      results.push({ item, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map(r => r.item);
}
