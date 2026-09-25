/**
 * Runnable demo:  npm run demo
 * Runs Evidence Readiness over sample SECOs against a fixed assessment date.
 */
import {
  assessEvidenceReadiness,
  EVENT_CLASS_LABELS,
  type Seco,
} from '../src/index.js';

const NOW = new Date('2026-03-01T12:00:00Z');

const samples: Seco[] = [
  {
    id: 'EVT-0356',
    eventClass: 'unforeseen_physical_conditions',
    occurredDate: '2026-02-28',
    evidence: [
      { type: 'condition_photo', present: true },
      { type: 'record_drawing_survey', present: true },
      { type: 'site_diary', present: true },
      { type: 'plant_labour_standby', present: true },
      { type: 'third_party_confirmation', present: false },
    ],
  },
  {
    id: 'EVT-0342',
    eventClass: 'late_information',
    occurredDate: '2026-01-20',
    evidence: [
      { type: 'rfi_or_request_log', present: true },
      { type: 'drawing_register', present: true },
      { type: 'programme_activity', present: true },
      { type: 'workfront_photo', present: false },
      { type: 'standby_record', present: false },
    ],
  },
  {
    id: 'EVT-0298',
    eventClass: 'predecessor_caused_rework',
    occurredDate: '2025-12-15',
    evidence: [{ type: 'predecessor_record', present: true }],
  },
];

const line = '-'.repeat(70);
for (const s of samples) {
  const r = assessEvidenceReadiness(s, undefined, NOW);
  console.log(line);
  console.log(`${s.id}  ·  ${EVENT_CLASS_LABELS[s.eventClass]}`);
  console.log(
    `  Readiness : ${r.score}%  [${r.band}]  ` +
      `held ${r.heldCount}/${r.requiredCount} · ${r.openObtainableGaps} closeable · ${r.lostGaps} lost`,
  );
  console.log(`  Action    : ${r.recommendedAction}`);
  if (r.gaps.length) {
    console.log('  Gaps      :');
    for (const g of r.gaps) {
      console.log(`    ${g.obtainable ? '[ obtainable ]' : '[   lost    ]'} ${g.label}`);
    }
  }
}
console.log(line);
console.log('Operational prioritisation only — every event stays under human review.');
