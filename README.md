# 📋 RCE Evidence Readiness

> Evidence-scoring engine for the **Construction Reality Contract Engine (RCE)**.
> Scores how well a site event is documented — and flags which missing items can
> **still be obtained** before they degrade.

[![CI](https://github.com/YOUR_ORG/rce-evidence-readiness/actions/workflows/ci.yml/badge.svg)](../../actions)
![Node](https://img.shields.io/badge/node-%3E%3D18-3c873a)
![Status](https://img.shields.io/badge/stage-prototype-1E6091)
![Type](https://img.shields.io/badge/output-prioritisation%20only-C0801B)

---

## Contents

1. [What it is](#what-it-is)
2. [Why it matters](#why-it-matters)
3. [How it works](#how-it-works)
4. [Install](#install)
5. [Quick start](#quick-start)
6. [API reference](#api-reference)
7. [Default requirements](#default-requirements)
8. [Configuring requirements](#configuring-requirements)
9. [Integrating into the platform](#integrating-into-the-platform)
10. [Testing & demo](#testing--demo)
11. [Project structure](#project-structure)
12. [Roadmap](#roadmap)
13. [Important boundary](#important-boundary)
14. [License](#license)

---

## What it is

When a construction event is recognised late, the real damage is often to the
**evidence**: the contemporaneous photo was never taken, the standby record was
never kept, the verbal instruction was never written down. By the time a
commercial team looks, some of that evidence is simply gone.

**Evidence Readiness** answers two operational questions for every event:

> **Is this documented well enough to review — and what should we chase now,
> before it's too late?**

It scores the documentation held against what the event class requires, then
marks every gap as **still obtainable** or **likely lost**, and recommends an
action. This is the engine behind the "Evidence Readiness" surface in the RCE
business plan (§4.2).

## Why it matters

| Business-plan reference | How this engine delivers it |
| --- | --- |
| §2.4 — delayed recognition degrades evidence | Distinguishes closeable gaps from lost ones |
| §4.2 — Evidence Readiness | This is that feature, as deterministic code |
| §5.3 — "rules first" (Stage 1) | Transparent scoring, no training data required |
| §6.3 / §16 — defensible IP | The evidence methodology is a proprietary asset |
| §21 — false negatives / missed events | Surfaces what to obtain while it still exists |

## How it works

For a SECO's event class, the engine looks up the required evidence items, checks
which are present, and returns a **weighted** score (0–100) and a band:

| Band | Score |
| --- | :---: |
| `strong` | ≥ 80 |
| `partial` | 50–79 |
| `weak` | < 50 |

Each **missing** item is assessed for obtainability, which depends on the item's
type and how old the occurrence is (`occurredDate`):

| Obtainability | Behaviour |
| --- | --- |
| `reconstructable` | Always obtainable (registers, correspondence, programme extracts) |
| `contemporaneous` | Obtainable until `decaysAfterDays` after the occurrence (e.g. a photo of a condition that gets covered up) |
| `time_critical` | Obtainable only briefly (standby records; a note of a verbal instruction) |

```
score  = Σ weight(held) / Σ weight(required) × 100
gap.obtainable = reconstructable
              OR (age since occurrence ≤ decaysAfterDays)
```

## Install

Requires Node 18+.

```bash
npm install          # install dev dependencies
npm test             # run the test suite
npm run demo         # print readiness + gaps for sample events
npm run build        # emit dist/ (ESM + .d.ts)
```

## Quick start

```ts
import { assessEvidenceReadiness } from '@rce/evidence-readiness';

const result = assessEvidenceReadiness({
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
});

// {
//   score: 70, band: 'partial',
//   heldCount: 3, requiredCount: 5,
//   openObtainableGaps: 2, lostGaps: 0,
//   recommendedAction: 'Evidence is partial. Close the 2 obtainable gap(s) now ...'
// }
```

## API reference

### `assessEvidenceReadiness(seco, profile?, now?, options?)`

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `seco` | `Seco` | — | The event (see below) |
| `profile` | `RequirementsProfile` | `DEFAULT_REQUIREMENTS` | Required items per event class |
| `now` | `Date` | `new Date()` | Assessment date — **inject for reproducible results** |
| `options` | `{ strongAt?, partialAt? }` | `{ 80, 50 }` | Band thresholds |

**Input — `Seco`** (only the fields this engine uses):

```ts
interface Seco {
  id: string;
  eventClass:
    | 'late_information'
    | 'access_obstruction'
    | 'unforeseen_physical_conditions'
    | 'client_designer_instruction'
    | 'predecessor_caused_rework';
  occurredDate?: string;                       // ISO — drives evidence decay
  evidence?: { type: string; present: boolean }[];
}
```

**Output — `ReadinessResult`:**

```ts
interface ReadinessResult {
  score: number;                 // 0–100, weighted
  band: 'strong' | 'partial' | 'weak';
  requiredCount: number;
  heldCount: number;
  held: string[];
  gaps: {
    type: string;
    label: string;
    weight: number;
    obtainable: boolean;
    reason: string;
  }[];
  openObtainableGaps: number;    // gaps you can still close
  lostGaps: number;              // gaps likely gone
  recommendedAction: string;
}
```

Also exported: the requirement types `EvidenceRequirement`,
`RequirementsProfile`, `Obtainability`, and `DEFAULT_REQUIREMENTS`.

## Default requirements

Derived from the evidence table in business plan §4.2. Example — *unforeseen
physical conditions*:

| Item | Weight | Obtainability | Decays after |
| --- | :---: | --- | :---: |
| Time-stamped photo of the condition | 3 | contemporaneous | 7 days |
| Record drawing / survey relied on | 3 | reconstructable | — |
| Site diary entry | 1 | reconstructable | — |
| Plant & labour standby record | 2 | time_critical | 7 days |
| Third-party / asset-owner confirmation | 1 | reconstructable | — |

All five event classes ship with default requirements; see
[`src/requirements.ts`](src/requirements.ts).

## Configuring requirements

Requirements are data, not code — extend or tune them per contract or client:

```ts
import { assessEvidenceReadiness, DEFAULT_REQUIREMENTS } from '@rce/evidence-readiness';

const profile = {
  ...DEFAULT_REQUIREMENTS,
  unforeseen_physical_conditions: [
    ...DEFAULT_REQUIREMENTS.unforeseen_physical_conditions,
    { type: 'utility_strike_permit', label: 'Permit to dig / utility record', weight: 2, obtainability: 'reconstructable' as const },
  ],
};

assessEvidenceReadiness(seco, profile);
```

## Integrating into the platform

Pure and side-effect free — call it from an API, a worker, or the UI. Example:
surface a "chase list" of closeable gaps for a project.

```ts
const chaseList = events.flatMap((e) => {
  const r = assessEvidenceReadiness(e);
  return r.gaps
    .filter((g) => g.obtainable)
    .map((g) => ({ event: e.id, item: g.label, reason: g.reason }));
});
```

## Testing & demo

```bash
npm test        # 5 unit tests (vitest): scoring, decay, bands, recommendations
npm run demo    # deterministic output with per-event gap breakdown
```

Tests inject a fixed `now`, so results never depend on the wall clock.

## Project structure

```
src/
  index.ts               public exports
  types.ts               SECO model + event classes
  dates.ts               UTC day maths
  evidenceReadiness.ts   the engine
  requirements.ts        evidence requirements per event class
tests/                   vitest suite
examples/                runnable demo + sample SECOs
.github/workflows/       CI (typecheck → test → build)
```

## Roadmap

- Per-client / per-contract requirement profiles
- Configurable decay curves (partial-credit rather than hard cut-off)
- Evidence-type synonyms / mapping to source systems (photos, RFIs, diaries)
- Assisted extraction to auto-tick items (business plan §5.3, Stage 2)

## Important boundary

This engine produces an **operational prioritisation signal only**. It does
**not** determine contractual entitlement and is **not** legal advice. The
readiness score indicates documentation completeness for review; it does not
assess the merit of any claim. Every output stays subject to professional human
review (business plan §4.4).

## License

© 2026 RCE. Proprietary — see [LICENSE](LICENSE).
