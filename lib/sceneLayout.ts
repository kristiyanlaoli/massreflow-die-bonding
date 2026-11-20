import type { Parameters } from './simulation';

/**
 * Keeps the pick-up wafer frame and target substrate spatially separated for
 * every die size supported by the UI. All distances are illustrative 3D units.
 * This must be shared by geometry and camera framing.
 */
export function getSceneLayout(p: Pick<Parameters, 'dieWidth' | 'dieHeight'>) {
  const dieW = p.dieWidth;
  const dieH = p.dieHeight;
  const gridStepX = dieW + 0.42;
  const gridStepZ = dieH + 0.42;
  // Furthest die corner in the 3x3 tape array (center slot reserved for pick-up)
  const radialExtent = Math.hypot(gridStepX + dieW / 2, gridStepZ + dieH / 2);
  const tapeRadius = Math.max(4.0, radialExtent + 0.75);
  const tapeOuterRadius = tapeRadius + 0.36; // torus and backing clearance
  const baseRadius = tapeOuterRadius + 0.82;
  const substrateWidth = Math.max(8.5, dieW + 3.6);
  const substrateDepth = Math.max(7.7, dieH + 3.6);
  const substrateX = 2.15;
  const gap = Math.max(2.6, Math.max(dieW, dieH) * 0.36);
  const waferX = substrateX - (substrateWidth / 2 + baseRadius + gap + .4);
  const leftEdge = waferX - baseRadius;
  const rightEdge = substrateX + substrateWidth / 2;

  return {
    tapeRadius,
    tapeOuterRadius,
    baseRadius,
    substrateWidth,
    substrateDepth,
    substrateX,
    waferX,
    gap,
    leftEdge,
    rightEdge,
    centerX: (leftEdge + rightEdge) / 2,
    fullWidth: rightEdge - leftEdge,
    fullDepth: Math.max(2 * baseRadius, substrateDepth),
  };
}
