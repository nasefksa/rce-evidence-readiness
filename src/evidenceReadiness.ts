import type { Seco } from './types.js';
import { dayDiff, toDate } from './dates.js';
import {
  DEFAULT_REQUIREMENTS,
  type EvidenceRequirement,
  type RequirementsProfile,
} from './requirements.js';

export type ReadinessBand = 'strong' | 'partial' | 'weak';

export interface EvidenceGap {
  type: string;
  label: string;
  weight: number;
  /** Whether the item can still realistically be obtained. */
  obtainable: boolean;
  reason: string;
}

export interface ReadinessResult {
  /** Weighted completeness, 0–100. */
  score: number;
  band: ReadinessBand;
  requiredCount: number;
  heldCount: number;
  held: string[];
  gaps: EvidenceGap[];
  /** Missing items that can still be obtained. */
  openObtainableGaps: number;
  /** Missing items that are likely lost. */
  lostGaps: number;
  recommendedAction: string;
}

export interface ReadinessOptions {
  strongAt?: number; // default 80
  partialAt?: number; // default 50
}

/**
 * Assess how well a SECO is evidenced, and which gaps are still closeable.
 *
 * The engine's core value (business plan §4.2) is not just "how complete" but
 * "which missing items can still be obtained" — so gaps can be closed while
 * they remain closeable.
 */
export function assessEvidenceReadiness(
  seco: Seco,
  profile: RequirementsProfile = DEFAULT_REQUIREMENTS,
  now: Date = new Date(),
  options: ReadinessOptions = {},
): ReadinessResult {
  const strongAt = options.strongAt ?? 80;
  const partialAt = options.partialAt ?? 50;

  const required: EvidenceRequirement[] = profile[seco.eventClass] ?? [];
  const presentTypes = new Set(
    (seco.evidence ?? []).filter((e) => e.present).map((e) => e.type),
  );

  const totalWeight = required.reduce((s, r) => s + r.weight, 0) || 1;
  let heldWeight = 0;
  const held: string[] = [];
  const gaps: EvidenceGap[] = [];

  const occurred = toDate(seco.occurredDate);
  const ageDays = occurred ? dayDiff(now, occurred) : null;

  for (const req of required) {
    if (presentTypes.has(req.type)) {
      heldWeight += req.weight;
      held.push(req.type);
      continue;
    }
    const { obtainable, reason } = assessGap(req, ageDays);
    gaps.push({ type: req.type, label: req.label, weight: req.weight, obtainable, reason });
  }

  const score = Math.round((heldWeight / totalWeight) * 100);
  const band: ReadinessBand = score >= strongAt ? 'strong' : score >= partialAt ? 'partial' : 'weak';
  const openObtainableGaps = gaps.filter((g) => g.obtainable).length;
  const lostGaps = gaps.filter((g) => !g.obtainable).length;

  return {
    score,
    band,
    requiredCount: required.length,
    heldCount: held.length,
    held,
    gaps,
    openObtainableGaps,
    lostGaps,
    recommendedAction: recommend(band, openObtainableGaps, lostGaps),
  };
}

function assessGap(
  req: EvidenceRequirement,
  ageDays: number | null,
): { obtainable: boolean; reason: string } {
  if (req.obtainability === 'reconstructable') {
    return { obtainable: true, reason: 'Can be reconstructed from records.' };
  }
  if (ageDays == null || req.decaysAfterDays == null) {
    return { obtainable: true, reason: 'Obtainable — capture as soon as possible.' };
  }
  if (ageDays > req.decaysAfterDays) {
    return {
      obtainable: false,
      reason: `Likely degraded — ${ageDays} days since the occurrence (typically lost after ${req.decaysAfterDays}).`,
    };
  }
  const left = req.decaysAfterDays - ageDays;
  return { obtainable: true, reason: `Still obtainable, but act within ~${left} day(s).` };
}

function recommend(band: ReadinessBand, open: number, lost: number): string {
  const lostNote = lost > 0 ? ` ${lost} item(s) are likely lost and cannot be recovered.` : '';
  if (band === 'strong') {
    return open > 0
      ? `Evidence base is strong. Close the ${open} remaining obtainable gap(s), then proceed to review.${lostNote}`
      : `Evidence base is strong — proceed to commercial review.${lostNote}`;
  }
  if (band === 'partial') {
    return open > 0
      ? `Evidence is partial. Close the ${open} obtainable gap(s) now to strengthen the record before review.${lostNote}`
      : `Evidence is partial and the obtainable gaps are exhausted — review with the record available.${lostNote}`;
  }
  return open > 0
    ? `Evidence is weak. Obtain the ${open} closeable item(s) urgently before they degrade.${lostNote}`
    : `Evidence is weak and gaps are no longer obtainable — escalate; the review route may be constrained.${lostNote}`;
}
