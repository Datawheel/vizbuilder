type EstimateResult = {
  targetCellWidth: number;
  minCellWidth: number;
  maxCellWidth: number;
  targetCellHeight: number;
  cols: number;
  rows: number;
  renderedCells: number;
  emptySlots: number;
  cellWidth: number;
  cellHeight: number;
  usedWidth: number;
  usedHeight: number;
  widthUtilization: number;
  heightUtilization: number;
};

export function estimateFromTargetCellWidth(
  W: number,
  H: number,
  targetWidth: number,
  options?: {
    tolerancePercent?: number; // default 15
    targetRatio?: number; // default 4/3
    maxCols?: number;
    preferFillWidth?: boolean; // unused but kept for compatibility
    nRequested?: number;
  },
): EstimateResult {
  if (W <= 0 || H <= 0 || targetWidth <= 0)
    throw new Error("W, H y targetWidth deben ser > 0");

  const tol = (options?.tolerancePercent ?? 15) / 100;
  const R = options?.targetRatio ?? 4 / 3;
  const minCellWidth = Math.max(1, Math.floor(targetWidth * (1 - tol)));
  const maxCellWidth = Math.max(minCellWidth, Math.ceil(targetWidth * (1 + tol)));

  const maxColsByMin = Math.floor(W / minCellWidth) || 1;
  const maxCols = Math.min(options?.maxCols ?? maxColsByMin, maxColsByMin);

  // target height derived from targetWidth (stable reference)
  const targetCellHeight = Math.max(1, Math.floor(targetWidth / R));

  let best: EstimateResult | null = null;

  for (let cols = 1; cols <= maxCols; cols++) {
    // compute candidate cell width constrained by container
    const maxCellWForCols = Math.floor(W / cols);
    if (maxCellWForCols < minCellWidth) continue;

    // choose cellW inside allowed tolerance and <= maxCellWForCols
    const cellW = Math.min(maxCellWidth, maxCellWForCols);
    if (cellW < minCellWidth) continue;

    // Instead of deriving rows from this exact cellH (which may jump),
    // use targetCellHeight as baseline, then ensure cellH fits and adjust if needed.
    // Determine rows as how many target heights fit; then ensure actual cellH doesn't exceed H/rows.
    const baselineRows = Math.max(1, Math.floor(H / targetCellHeight));
    // clamp rows to at least 1 and to a reasonable max (so we don't pick excessive rows)
    const rows = Math.max(1, baselineRows);

    // Now compute actual cellH allowed by vertical space for these rows
    const maxCellHForRows = Math.floor(H / rows);
    // actual cellH must be <= maxCellHForRows and consistent with ratio from cellW
    const cellH = Math.min(maxCellHForRows, Math.floor(cellW / R));
    if (cellH <= 0) continue;

    // recompute cellW in case height constraint is tighter (keep within tolerance)
    const adjustedCellW = Math.min(
      cellW,
      Math.floor(Math.min(maxCellWForCols, Math.floor(R * cellH))),
    );
    if (adjustedCellW < minCellWidth) continue;

    const finalCellW = adjustedCellW;
    const finalCellH = cellH;

    const renderedCells = cols * rows;
    const usedWidth = cols * finalCellW;
    const usedHeight = rows * finalCellH;
    const widthUtilization = usedWidth / W;
    const heightUtilization = usedHeight / H;

    const candidate: EstimateResult = {
      targetCellWidth: targetWidth,
      minCellWidth,
      maxCellWidth,
      targetCellHeight,
      cols,
      rows,
      renderedCells,
      emptySlots: options?.nRequested
        ? Math.max(0, cols * rows - options!.nRequested!)
        : 0,
      cellWidth: finalCellW,
      cellHeight: finalCellH,
      usedWidth,
      usedHeight,
      widthUtilization,
      heightUtilization,
    };

    if (!best) {
      best = candidate;
      continue;
    }

    // prefer more renderedCells, then better width utilization, then larger cells
    if (
      candidate.renderedCells > best.renderedCells ||
      (candidate.renderedCells === best.renderedCells &&
        candidate.widthUtilization > best.widthUtilization) ||
      (candidate.renderedCells === best.renderedCells &&
        candidate.widthUtilization === best.widthUtilization &&
        candidate.cellWidth > best.cellWidth)
    ) {
      best = candidate;
    }
  }

  // fallback similar to before if nothing found
  if (!best) {
    const cols = Math.max(1, Math.floor(W / minCellWidth));
    const cellW = Math.min(maxCellWidth, Math.floor(W / cols));
    const cellH = Math.max(1, Math.floor(cellW / R));
    const rows = Math.max(1, Math.floor(H / cellH));
    best = {
      targetCellWidth: targetWidth,
      minCellWidth,
      maxCellWidth,
      targetCellHeight,
      cols,
      rows,
      renderedCells: cols * rows,
      emptySlots: options?.nRequested
        ? Math.max(0, cols * rows - options!.nRequested!)
        : 0,
      cellWidth: cellW,
      cellHeight: cellH,
      usedWidth: cols * cellW,
      usedHeight: rows * cellH,
      widthUtilization: (cols * cellW) / W,
      heightUtilization: (rows * cellH) / H,
    };
  }

  return best;
}
