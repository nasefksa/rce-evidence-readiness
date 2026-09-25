import { describe, it, expect } from 'vitest';
import { assessEvidenceReadiness, type Seco } from '../src/index.js';

const NOW = new Date('2026-03-01T12:00:00Z');

describe('Evidence Readiness', () => {
  it('scores 100 and strong when all items are held', () => {
    const s: Seco = {
      id: 'EVT-1',
      eventClass: 'late_information',
      occurredDate: '2026-02-28',
      evidence: [
        { type: 'rfi_or_request_log', present: true },
        { type: 'drawing_register', present: true },
        { type: 'programme_activity', present: true },
        { type: 'workfront_photo', present: true },
        { type: 'standby_record', present: true },
      ],
    };
    const r = assessEvidenceReadiness(s, undefined, NOW);
    expect(r.score).toBe(100);
    expect(r.band).toBe('strong');
    expect(r.gaps).toHaveLength(0);
  });

  it('computes a weighted partial score with obtainable gaps', () => {
    const s: Seco = {
      id: 'EVT-2',
      eventClass: 'late_information',
      occurredDate: '2026-02-28',
      evidence: [
        { type: 'rfi_or_request_log', present: true },
        { type: 'drawing_register', present: true },
      ],
    };
    const r = assessEvidenceReadiness(s, undefined, NOW);
    expect(r.score).toBe(50);
    expect(r.band).toBe('partial');
    expect(r.openObtainableGaps).toBe(3);
    expect(r.lostGaps).toBe(0);
  });

  it('flags time-critical evidence as lost once it has decayed', () => {
    const s: Seco = {
      id: 'EVT-3',
      eventClass: 'unforeseen_physical_conditions',
      occurredDate: '2026-01-01',
      evidence: [{ type: 'record_drawing_survey', present: true }],
    };
    const r = assessEvidenceReadiness(s, undefined, NOW);
    const photoGap = r.gaps.find((g) => g.type === 'condition_photo');
    expect(photoGap?.obtainable).toBe(false);
    expect(r.lostGaps).toBeGreaterThan(0);
  });

  it('treats reconstructable items as always obtainable', () => {
    const s: Seco = {
      id: 'EVT-4',
      eventClass: 'access_obstruction',
      occurredDate: '2025-06-01',
      evidence: [],
    };
    const r = assessEvidenceReadiness(s, undefined, NOW);
    const accessDates = r.gaps.find((g) => g.type === 'access_dates');
    expect(accessDates?.obtainable).toBe(true);
  });

  it('gives a weak band and an urgent recommendation when little is held', () => {
    const s: Seco = {
      id: 'EVT-5',
      eventClass: 'client_designer_instruction',
      occurredDate: '2026-02-28',
      evidence: [],
    };
    const r = assessEvidenceReadiness(s, undefined, NOW);
    expect(r.score).toBe(0);
    expect(r.band).toBe('weak');
    expect(r.recommendedAction).toMatch(/urgently/i);
  });
});
