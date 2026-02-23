export interface LayoutResult {
  pageIndex: number;
  columns: number;
  rows: number;
  itemsPerPage: number;
  cellWidth: number;
  cellHeight: number;
}

export interface CalcOptions {
  containerWidth: number;
  containerHeight: number;
  targetCellWidth: number;
  minCellWidth?: number;
  gap?: number;
  aspectRatio?: number;
  widthFlex?: number;
  totalItems?: number;
}

export function calculateLayout(options: CalcOptions): LayoutResult[] {
  const cw = Math.max(1, options.containerWidth);
  const ch = Math.max(1, options.containerHeight);
  const tw = Math.max(1, options.targetCellWidth);
  const gap = Math.max(0, options.gap ?? 0);
  const ar = Math.max(0.1, options.aspectRatio ?? 1.6);
  const flex = Math.max(0, options.widthFlex ?? 0.15);
  const total = Math.max(0, options.totalItems ?? 0);

  // Establish our hard minimum limit
  const absoluteMinW = Math.max(1, options.minCellWidth ?? 0);

  // Combine flex minimum with our absolute minimum circuit breaker
  const minW = Math.max(absoluteMinW, tw * (1 - flex));
  const maxW = tw * (1 + flex);

  // 1. Calculate ideal standard page columns deterministically
  const exactCols = (cw + gap) / (tw + gap);
  const cFloor = Math.max(1, Math.floor(exactCols));
  const cCeil = Math.max(1, Math.ceil(exactCols));

  const wFloor = (cw - (cFloor - 1) * gap) / cFloor;
  const wCeil = (cw - (cCeil - 1) * gap) / cCeil;

  let c = cFloor;
  let cellW = wFloor;

  if (cFloor !== cCeil) {
    const floorValid = wFloor >= minW && wFloor <= maxW;
    const ceilValid = wCeil >= minW && wCeil <= maxW;

    if (floorValid && !ceilValid) {
      c = cFloor;
      cellW = wFloor;
    } else if (ceilValid && !floorValid) {
      c = cCeil;
      cellW = wCeil;
    } else {
      // If neither is perfectly valid, apply the strict minimum check
      if (wCeil < absoluteMinW) {
        c = cFloor;
        cellW = wFloor;
      } else {
        // Otherwise, safely pick the closest to our target
        if (Math.abs(wCeil - tw) < Math.abs(wFloor - tw)) {
          c = cCeil;
          cellW = wCeil;
        }
      }
    }
  }

  // 2. Calculate standard rows
  const cellH = cellW / ar;
  const r = Math.max(1, Math.floor((ch + gap) / (cellH + gap) + 0.001));
  const itemsPerPage = c * r;

  const results: LayoutResult[] = [];

  if (total === 0) {
    results.push({
      pageIndex: 0,
      columns: c,
      rows: r,
      itemsPerPage,
      cellWidth: cellW,
      cellHeight: cellH,
    });
    return results;
  }

  // 3. Paginate
  const totalPages = Math.ceil(total / itemsPerPage);

  for (let p = 0; p < totalPages; p++) {
    const isLastPage = p === totalPages - 1;
    const itemsOnThisPage =
      isLastPage && total % itemsPerPage !== 0 ? total % itemsPerPage : itemsPerPage;

    if (isLastPage && itemsOnThisPage < itemsPerPage) {
      let bestCols = 1;
      let bestRows = itemsOnThisPage;
      let bestScore = Infinity;

      for (let lc = 1; lc <= itemsOnThisPage; lc++) {
        const lr = Math.ceil(itemsOnThisPage / lc);
        const emptySlots = lc * lr - itemsOnThisPage;

        const dynamicW = (cw - (lc - 1) * gap) / lc;
        const dynamicH = (ch - (lr - 1) * gap) / lr;
        const currentAr = dynamicH > 0 ? dynamicW / dynamicH : 0;

        const arFactor =
          currentAr > ar ? currentAr / ar : currentAr > 0 ? ar / currentAr : Infinity;
        const arPenalty = arFactor - 1;

        const score = arPenalty + emptySlots;

        if (score < bestScore) {
          bestScore = score;
          bestCols = lc;
          bestRows = lr;
        }
      }

      results.push({
        pageIndex: p,
        columns: bestCols,
        rows: bestRows,
        itemsPerPage: bestCols * bestRows,
        cellWidth: (cw - (bestCols - 1) * gap) / bestCols,
        cellHeight: (ch - (bestRows - 1) * gap) / bestRows,
      });
    } else {
      results.push({
        pageIndex: p,
        columns: c,
        rows: r,
        itemsPerPage,
        cellWidth: cellW,
        cellHeight: cellH,
      });
    }
  }

  return results;
}
