import { ProductBatch, LocationInfo, ProductDuplicateGroup, CatalogDuplicateAuditReport } from '../types';

/**
 * Normalizes strings for strict duplicate comparison (removes whitespace, special chars, lowercases)
 */
export function normalizeCode(str?: string): string {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizeName(name?: string): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks whether an incoming product's barcode, SKU, or Name conflicts with an existing product in the catalog.
 */
export function checkDuplicateConflict(
  candidate: {
    barcode?: string;
    sku?: string;
    name?: string;
    category?: string;
    excludeId?: string;
  },
  products: ProductBatch[]
): {
  isDuplicate: boolean;
  matchType?: 'barcode' | 'sku' | 'name';
  existingProduct: ProductBatch | null;
  message: string;
} {
  const normBarcode = candidate.barcode ? normalizeCode(candidate.barcode) : '';
  const normSku = candidate.sku ? normalizeCode(candidate.sku) : '';
  const normName = candidate.name ? normalizeName(candidate.name) : '';

  for (const p of products) {
    if (candidate.excludeId && p.id === candidate.excludeId) continue;

    // 1. Strict Barcode Check
    if (normBarcode && p.barcode && normalizeCode(p.barcode) === normBarcode) {
      return {
        isDuplicate: true,
        matchType: 'barcode',
        existingProduct: p,
        message: `Barcode "${candidate.barcode}" is already assigned to "${p.name}" (${p.sku}). Registering a duplicate barcode will corrupt inventory stock counts and skew physical audit valuation.`
      };
    }

    // 2. Barcode matching SKU (often barcodes are SKUs)
    if (normBarcode && p.sku && normalizeCode(p.sku) === normBarcode) {
      return {
        isDuplicate: true,
        matchType: 'barcode',
        existingProduct: p,
        message: `Scanned code "${candidate.barcode}" matches existing Product SKU "${p.sku}" (${p.name}). Duplicate prevention engaged.`
      };
    }

    // 3. Strict SKU Check
    if (normSku && p.sku && normalizeCode(p.sku) === normSku) {
      return {
        isDuplicate: true,
        matchType: 'sku',
        existingProduct: p,
        message: `SKU code "${candidate.sku}" already exists for "${p.name}". Duplicate SKUs create double-entry errors on your Balance Sheet asset inventory.`
      };
    }

    // 4. Exact Name & Category Check
    if (normName && p.name && normalizeName(p.name) === normName && (!candidate.category || p.category === candidate.category)) {
      return {
        isDuplicate: true,
        matchType: 'name',
        existingProduct: p,
        message: `A product named "${p.name}" already exists under category "${p.category}" (SKU: ${p.sku}). Creating a duplicate item splits inventory tracking across multiple records.`
      };
    }
  }

  return {
    isDuplicate: false,
    existingProduct: null,
    message: ''
  };
}

/**
 * Scans the entire inventory catalog for duplicate items by Barcode, SKU, or identical Name.
 * Calculates financial asset distortion (KSh) caused by duplicates.
 */
export function calculateCatalogDuplicateReport(
  products: ProductBatch[],
  locations: LocationInfo[]
): CatalogDuplicateAuditReport {
  const duplicateGroups: ProductDuplicateGroup[] = [];
  const processedIds = new Set<string>();

  // 1. Group by Barcode
  const barcodeMap = new Map<string, ProductBatch[]>();
  // 2. Group by SKU
  const skuMap = new Map<string, ProductBatch[]>();
  // 3. Group by Name + Category
  const nameMap = new Map<string, ProductBatch[]>();

  products.forEach(p => {
    if (p.barcode && p.barcode.trim()) {
      const bKey = normalizeCode(p.barcode);
      if (!barcodeMap.has(bKey)) barcodeMap.set(bKey, []);
      barcodeMap.get(bKey)!.push(p);
    }

    if (p.sku && p.sku.trim()) {
      const sKey = normalizeCode(p.sku);
      if (!skuMap.has(sKey)) skuMap.set(sKey, []);
      skuMap.get(sKey)!.push(p);
    }

    if (p.name && p.name.trim()) {
      const nKey = `${p.category || ''}::${normalizeName(p.name)}`;
      if (!nameMap.has(nKey)) nameMap.set(nKey, []);
      nameMap.get(nKey)!.push(p);
    }
  });

  const registerGroup = (
    key: string,
    matchType: 'barcode' | 'sku' | 'name',
    items: ProductBatch[]
  ) => {
    if (items.length <= 1) return;

    // Filter out if already completely grouped
    const unvisited = items.filter(it => !processedIds.has(it.id));
    if (unvisited.length === 0) return;

    // Primary master is sorted by creation or lowest id
    const master = items[0];
    const duplicates = items.slice(1);

    duplicates.forEach(d => processedIds.add(d.id));
    processedIds.add(master.id);

    // Calculate total stock and valuation of duplicate rows
    let stockDistortion = 0;
    let costDistortion = 0;
    let retailDistortion = 0;

    duplicates.forEach(dup => {
      const dupTotalStock = Object.values(dup.locationStock || {}).reduce((a, b) => a + (Number(b) || 0), 0);
      stockDistortion += dupTotalStock;
      costDistortion += dupTotalStock * (dup.costPrice || master.costPrice || 0);
      retailDistortion += dupTotalStock * (dup.unitPriceRetail || master.unitPriceRetail || 0);
    });

    duplicateGroups.push({
      key,
      matchType,
      masterProduct: master,
      duplicates,
      totalDuplicateCount: duplicates.length,
      totalStockDistortion: stockDistortion,
      financialValuationDistortionCost: costDistortion,
      financialValuationDistortionRetail: retailDistortion
    });
  };

  // Group by Barcode matches first
  barcodeMap.forEach((items, key) => registerGroup(key, 'barcode', items));
  // Group by SKU matches
  skuMap.forEach((items, key) => registerGroup(key, 'sku', items));
  // Group by Name matches
  nameMap.forEach((items, key) => registerGroup(key, 'name', items));

  let totalDuplicateRecords = 0;
  let totalStockDistortionUnits = 0;
  let totalFinancialDistortionCost = 0;
  let totalFinancialDistortionRetail = 0;

  duplicateGroups.forEach(g => {
    totalDuplicateRecords += g.duplicates.length;
    totalStockDistortionUnits += g.totalStockDistortion;
    totalFinancialDistortionCost += g.financialValuationDistortionCost;
    totalFinancialDistortionRetail += g.financialValuationDistortionRetail;
  });

  return {
    totalProductsScanned: products.length,
    duplicateGroupsCount: duplicateGroups.length,
    totalDuplicateRecords,
    totalStockDistortionUnits,
    totalFinancialDistortionCost,
    totalFinancialDistortionRetail,
    duplicateGroups,
    isAuditClean: duplicateGroups.length === 0,
    auditGeneratedAt: new Date().toISOString()
  };
}

/**
 * Generates an auto-incremented or suffixed clean unique SKU to avoid conflict.
 */
export function generateUniqueSku(baseSku: string, existingProducts: ProductBatch[]): string {
  const existingSkus = new Set(existingProducts.map(p => normalizeCode(p.sku)));
  let candidate = baseSku.trim() || 'TFX-PROD-101';
  let counter = 1;

  while (existingSkus.has(normalizeCode(candidate))) {
    // If it ends with numbers, increment
    const match = candidate.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2], 10) + 1;
      candidate = `${prefix}${String(num).padStart(match[2].length, '0')}`;
    } else {
      candidate = `${baseSku}-v${counter}`;
      counter++;
    }
  }

  return candidate;
}

/**
 * Generates an auto-incremented clean unique Barcode to avoid conflict.
 */
export function generateUniqueBarcode(baseBarcode: string, existingProducts: ProductBatch[]): string {
  const existingCodes = new Set(
    existingProducts.flatMap(p => [normalizeCode(p.barcode), normalizeCode(p.sku)]).filter(Boolean)
  );

  let candidate = baseBarcode.trim() || `616${Math.floor(100000000 + Math.random() * 900000000)}`;
  let counter = 1;

  while (existingCodes.has(normalizeCode(candidate))) {
    candidate = `616${Math.floor(100000000 + Math.random() * 900000000)}`;
    counter++;
    if (counter > 20) {
      candidate = `${baseBarcode}-${Date.now().toString().slice(-4)}`;
      break;
    }
  }

  return candidate;
}
