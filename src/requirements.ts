import type { EventClass } from './types.js';

/**
 * How obtainable an evidence item is after the fact:
 *  - contemporaneous: must be captured at the time; hard to recreate.
 *  - time_critical:   degrades quickly (memory, standby records).
 *  - reconstructable: can be assembled later from records/registers.
 */
export type Obtainability = 'contemporaneous' | 'time_critical' | 'reconstructable';

export interface EvidenceRequirement {
  type: string;
  label: string;
  /** Relative importance; the engine normalises against the total. */
  weight: number;
  obtainability: Obtainability;
  /** Days after the occurrence beyond which the item is likely lost. */
  decaysAfterDays?: number;
}

export type RequirementsProfile = Record<EventClass, EvidenceRequirement[]>;

/** Default evidence requirements, derived from business plan §4.2. */
export const DEFAULT_REQUIREMENTS: RequirementsProfile = {
  late_information: [
    { type: 'rfi_or_request_log', label: 'RFI / information request with dates', weight: 3, obtainability: 'reconstructable' },
    { type: 'drawing_register', label: 'Drawing register showing prior revision', weight: 2, obtainability: 'reconstructable' },
    { type: 'programme_activity', label: 'Affected programme activity / baseline', weight: 2, obtainability: 'reconstructable' },
    { type: 'workfront_photo', label: 'Contemporaneous photo of the workfront', weight: 2, obtainability: 'contemporaneous', decaysAfterDays: 14 },
    { type: 'standby_record', label: 'Labour / plant standby record', weight: 1, obtainability: 'time_critical', decaysAfterDays: 7 },
  ],
  access_obstruction: [
    { type: 'access_dates', label: 'Planned vs actual access dates', weight: 3, obtainability: 'reconstructable' },
    { type: 'occupation_photo', label: 'Photo of the occupied / unavailable area', weight: 2, obtainability: 'contemporaneous', decaysAfterDays: 14 },
    { type: 'interface_correspondence', label: 'Interface / handover correspondence', weight: 2, obtainability: 'reconstructable' },
    { type: 'resource_standby', label: 'Resource standby / re-sequence record', weight: 2, obtainability: 'time_critical', decaysAfterDays: 7 },
    { type: 'programme_access', label: 'Programme access-date extract', weight: 1, obtainability: 'reconstructable' },
  ],
  unforeseen_physical_conditions: [
    { type: 'condition_photo', label: 'Time-stamped photo of the condition', weight: 3, obtainability: 'contemporaneous', decaysAfterDays: 7 },
    { type: 'record_drawing_survey', label: 'Record drawing / survey relied on', weight: 3, obtainability: 'reconstructable' },
    { type: 'site_diary', label: 'Site diary entry', weight: 1, obtainability: 'reconstructable' },
    { type: 'plant_labour_standby', label: 'Plant & labour standby record', weight: 2, obtainability: 'time_critical', decaysAfterDays: 7 },
    { type: 'third_party_confirmation', label: 'Third-party / asset-owner confirmation', weight: 1, obtainability: 'reconstructable' },
  ],
  client_designer_instruction: [
    { type: 'written_instruction', label: 'Written instruction / PMI', weight: 3, obtainability: 'reconstructable' },
    { type: 'verbal_note', label: 'Dated note of any verbal instruction', weight: 2, obtainability: 'time_critical', decaysAfterDays: 3 },
    { type: 'revised_detail', label: 'Revised detail / sketch reference', weight: 2, obtainability: 'reconstructable' },
    { type: 'minutes_reference', label: 'Meeting / site-walk minutes reference', weight: 1, obtainability: 'reconstructable' },
  ],
  predecessor_caused_rework: [
    { type: 'predecessor_record', label: 'Predecessor survey / handover record', weight: 3, obtainability: 'reconstructable' },
    { type: 'defect_rework_photo', label: 'Photo of defect and resulting rework', weight: 3, obtainability: 'contemporaneous', decaysAfterDays: 7 },
    { type: 'rebuild_resources', label: 'Rebuild labour / plant record', weight: 2, obtainability: 'time_critical', decaysAfterDays: 7 },
    { type: 'awareness_record', label: 'Contemporaneous awareness-date record', weight: 2, obtainability: 'time_critical', decaysAfterDays: 3 },
  ],
};
